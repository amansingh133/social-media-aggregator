import Post from "../models/Post.js";
import Comment from "../models/Comment.js";
import SocialAccount from "../models/SocialAccount.js";
import SocialServiceFactory from "./social/SocialServiceFactory.js";
import ApiError from "../utils/ApiError.js";

/**
 * All post-related business logic lives here, decoupled from Express.
 * Controllers stay thin and only translate HTTP <-> this service.
 */
export default class PostService {
  /**
   * Fetch posts for ONE account from its platform API and upsert them
   * into MongoDB. Returns the account's posts from our own DB afterwards.
   */
  static async syncAccount(accountId) {
    const account =
      await SocialAccount.findById(accountId).select("+accessToken");
    if (!account) throw new ApiError(404, "Social account not found");

    const service = SocialServiceFactory.create(account);
    const normalizedPosts = await service.getNormalizedPosts();

    const bulkOps = normalizedPosts.map((post) => ({
      updateOne: {
        filter: { platform: post.platform, externalId: post.externalId },
        update: { $set: post },
        upsert: true,
      },
    }));

    if (bulkOps.length > 0) {
      await Post.bulkWrite(bulkOps);
    }

    account.lastSyncedAt = new Date();
    await account.save();

    return Post.find({
      platform: account.platform,
      accountRef: account._id,
    }).sort({
      publishedAt: -1,
    });
  }

  /**
   * Sync every active account, optionally scoped to one platform.
   * Uses allSettled so one failing account doesn't block the others.
   */
  static async syncAll({ platform } = {}) {
    const filter = { isActive: true, ...(platform ? { platform } : {}) };
    const accounts = await SocialAccount.find(filter);

    const results = await Promise.allSettled(
      accounts.map((acc) => PostService.syncAccount(acc._id)),
    );

    return results.map((result, i) => ({
      accountId: accounts[i]._id,
      platform: accounts[i].platform,
      status: result.status,
      ...(result.status === "rejected" ? { error: result.reason.message } : {}),
    }));
  }

  /**
   * Read posts from our own DB (fast, no external API call) with
   * platform filtering, text search, and pagination.
   */
  static async getPosts({ platform, page = 1, limit = 20, search } = {}) {
    const query = {};
    if (platform) query.platform = platform;
    if (search) query.message = { $regex: search, $options: "i" };

    const skip = (Number(page) - 1) * Number(limit);

    const [posts, total] = await Promise.all([
      Post.find(query)
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Post.countDocuments(query),
    ]);

    return {
      posts,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }

  static async getPostById(id) {
    const post = await Post.findById(id);
    if (!post) throw new ApiError(404, "Post not found");
    return post;
  }

  // ---------- Comments ----------

  /**
   * Pulls comments for ONE post from its platform and upserts them into
   * the Comment collection. Requires the platform's service to implement
   * fetchComments()/normalizeComment() - currently Facebook and Instagram
   * both do.
   */
  static async syncComments(postId) {
    const post = await Post.findById(postId);
    if (!post) throw new ApiError(404, "Post not found");

    const account = await SocialAccount.findById(post.accountRef).select(
      "+accessToken",
    );
    if (!account)
      throw new ApiError(404, "Associated social account not found");

    const service = SocialServiceFactory.create(account);
    if (typeof service.fetchComments !== "function") {
      throw new ApiError(
        400,
        `Comments are not supported for platform: ${account.platform}`,
      );
    }

    const rawComments = await service.fetchComments(post.externalId);
    const normalized = rawComments.map((raw) =>
      service.normalizeComment(raw, post._id),
    );

    const bulkOps = normalized.map((c) => ({
      updateOne: {
        filter: { platform: c.platform, externalId: c.externalId },
        update: { $set: c },
        upsert: true,
      },
    }));
    if (bulkOps.length > 0) {
      await Comment.bulkWrite(bulkOps);
    }

    return Comment.find({ postRef: post._id }).sort({ publishedAt: -1 });
  }

  static async getComments(postId) {
    return Comment.find({ postRef: postId }).sort({ publishedAt: -1 });
  }

  // ---------- Insights ----------

  /**
   * Pulls the latest insights/reactions snapshot for ONE post and saves
   * it directly on the Post document (not a history - just "as of now").
   */
  static async syncInsights(postId) {
    const post = await Post.findById(postId);
    if (!post) throw new ApiError(404, "Post not found");

    const account = await SocialAccount.findById(post.accountRef).select(
      "+accessToken",
    );
    if (!account)
      throw new ApiError(404, "Associated social account not found");

    const service = SocialServiceFactory.create(account);
    if (typeof service.fetchInsights !== "function") {
      throw new ApiError(
        400,
        `Insights are not supported for platform: ${account.platform}`,
      );
    }

    const insights = await service.fetchInsights(post.externalId);
    post.insights = insights;
    post.insightsUpdatedAt = new Date();
    await post.save();

    return post;
  }
}
