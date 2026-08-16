import axios from "axios";
import BaseSocialService from "./BaseSocialService.js";
import { env } from "../../config/env.js";
import { PLATFORMS } from "../../constants/platforms.js";
import ApiError from "../../utils/ApiError.js";
import {
  facebookAccountMetrics,
  facebookPostMetrics,
} from "../../constants/metric.js";

// Fields requested from the Facebook Graph API /{page-id}/posts endpoint
const FIELDS = [
  "id",
  "message",
  "created_time",
  "permalink_url",
  "full_picture",
  "attachments{media_type,url,media}",
  "likes.summary(true)",
  "comments.summary(true)",
].join(",");

export default class FacebookService extends BaseSocialService {
  async fetchRawPosts({ limit = 25 } = {}) {
    const { pageId, accessToken } = this.account;
    if (!pageId || !accessToken) {
      throw new ApiError(
        400,
        "Facebook account is missing pageId or accessToken",
      );
    }

    const url = `https://graph.facebook.com/${env.facebook.graphVersion}/${pageId}/posts`;

    try {
      const { data } = await axios.get(url, {
        params: { fields: FIELDS, limit, access_token: accessToken },
      });
      return data?.data ?? [];
    } catch (err) {
      const message = err.response?.data?.error?.message || err.message;
      throw new ApiError(
        err.response?.status || 502,
        `Facebook API error: ${message}`,
      );
    }
  }

  normalizePost(raw) {
    return {
      platform: PLATFORMS.FACEBOOK,
      externalId: raw.id,
      accountRef: this.account._id,
      author: this.account.displayName || this.account.pageId,
      message: raw.message || "",
      mediaType: raw.attachments?.data?.[0]?.media_type || "status",
      mediaUrl:
        raw.attachments?.data?.[0]?.media?.image?.src ||
        raw.full_picture ||
        null,
      permalink: raw.permalink_url || null,
      likeCount: raw.likes?.summary?.total_count || 0,
      commentCount: raw.comments?.summary?.total_count || 0,
      publishedAt: raw.created_time ? new Date(raw.created_time) : new Date(),
      raw,
    };
  }

  /**
   * Fetches comments on a single Page post via the dedicated /comments edge
   * (NOT the insights endpoint - comments are a stable edge, not a metric
   * name, so they're much less likely to be deprecated out from under you).
   */
  async fetchComments(postExternalId) {
    const { accessToken } = this.account;
    const url = `https://graph.facebook.com/${env.facebook.graphVersion}/${postExternalId}/comments`;
    try {
      const { data } = await axios.get(url, {
        params: {
          fields: "id,message,from,created_time,like_count",
          access_token: accessToken,
        },
      });
      return data?.data ?? [];
    } catch (err) {
      const message = err.response?.data?.error?.message || err.message;
      throw new ApiError(
        err.response?.status || 502,
        `Facebook comments error: ${message}`,
      );
    }
  }

  normalizeComment(raw, postRef) {
    return {
      platform: PLATFORMS.FACEBOOK,
      externalId: raw.id,
      postRef,
      authorUsername: raw.from?.name || "Unknown",
      message: raw.message || "",
      likeCount: raw.like_count || 0,
      publishedAt: raw.created_time ? new Date(raw.created_time) : new Date(),
      raw,
    };
  }

  /**
   * Reaction-breakdown "insights" for one post. Meta deprecated the old
   * post_impressions family of metrics (June 2026) - this uses the
   * per-reaction-type totals instead, which are a separate, currently-
   * documented metric set. If this starts erroring with "must be a valid
   * insights metric", check the current list at:
   * https://developers.facebook.com/docs/graph-api/reference/insights/
   */
  async fetchInsights(postExternalId) {
    const { accessToken } = this.account;
    // const metrics = [
    //   "post_reactions_like_total",
    //   "post_reactions_love_total",
    //   "post_reactions_wow_total",
    //   "post_reactions_haha_total",
    //   "post_reactions_sorry_total",
    //   "post_reactions_anger_total",
    // ];

    const url = `https://graph.facebook.com/${env.facebook.graphVersion}/${postExternalId}/insights`;
    try {
      const { data } = await axios.get(url, {
        params: {
          metric: facebookPostMetrics.join(","),
          access_token: accessToken,
        },
      });

      const result = {};
      (data?.data ?? []).forEach((m) => {
        result[m.name] = m.values?.[0]?.value ?? 0;
      });
      return result;
    } catch (err) {
      const message = err.response?.data?.error?.message || err.message;
      throw new ApiError(
        err.response?.status || 502,
        `Facebook insights error: ${message}`,
      );
    }
  }

  /**
   * Account-level ("Overview" tab equivalent) stats. Queries each metric
   * SEPARATELY on purpose - Meta deprecates individual Page Insights
   * metrics fairly often and inconsistently per-Page, and a combined
   * multi-metric request fails ENTIRELY if even one metric is invalid.
   * Querying one at a time means a dead metric just gets skipped and
   * reported in `errors`, instead of taking the whole call down with it.
   */
  async fetchAccountInsights() {
    const { pageId, accessToken } = this.account;
    // const metrics = [
    //   "page_views_total",
    //   "page_fan_adds_unique",
    //   "page_engaged_users",
    // ];

    const insightsBase = `https://graph.facebook.com/${env.facebook.graphVersion}/${pageId}/insights`;
    const fieldsUrl = `https://graph.facebook.com/${env.facebook.graphVersion}/${pageId}`;

    const result = {};
    const errors = [];

    await Promise.all(
      facebookAccountMetrics.map(async (metric) => {
        try {
          const { data } = await axios.get(insightsBase, {
            params: { metric, period: "day", access_token: accessToken },
          });
          const entry = data?.data?.[0];
          const total = (entry?.values ?? []).reduce(
            (sum, v) => sum + (v.value || 0),
            0,
          );
          result[metric] = total;
        } catch (err) {
          errors.push(
            `${metric}: ${err.response?.data?.error?.message || err.message}`,
          );
        }
      }),
    );

    try {
      const { data } = await axios.get(fieldsUrl, {
        params: { fields: "followers_count", access_token: accessToken },
      });
      result.followers_count = data?.followers_count ?? 0;
    } catch (err) {
      errors.push(
        `followers_count: ${err.response?.data?.error?.message || err.message}`,
      );
    }

    return { metrics: result, errors };
  }
}
