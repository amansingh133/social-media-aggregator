import SocialAccount from "../models/SocialAccount.js";
import SocialServiceFactory from "./social/SocialServiceFactory.js";
import ApiError from "../utils/ApiError.js";

export default class SocialAccountService {
  static async create(payload) {
    return SocialAccount.create(payload);
  }

  static async list() {
    return SocialAccount.find().sort({ createdAt: -1 });
  }

  static async remove(id) {
    const account = await SocialAccount.findByIdAndDelete(id);
    if (!account) throw new ApiError(404, "Social account not found");
    return account;
  }

  /**
   * Pulls account-level ("Overview" tab) stats - views, reach, follower
   * count, engagement - and saves the latest snapshot on the account
   * document itself.
   */
  static async syncAccountInsights(id) {
    const account = await SocialAccount.findById(id).select("+accessToken");
    if (!account) throw new ApiError(404, "Social account not found");

    const service = SocialServiceFactory.create(account);
    if (typeof service.fetchAccountInsights !== "function") {
      throw new ApiError(
        400,
        `Account insights are not supported for platform: ${account.platform}`,
      );
    }

    const insights = await service.fetchAccountInsights();
    account.accountInsights = insights;
    account.accountInsightsUpdatedAt = new Date();
    await account.save();

    return account;
  }
}
