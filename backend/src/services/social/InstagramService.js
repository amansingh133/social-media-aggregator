import axios from "axios";
import BaseSocialService from "./BaseSocialService.js";
import { env } from "../../config/env.js";
import { PLATFORMS } from "../../constants/platforms.js";
import ApiError from "../../utils/ApiError.js";
import {
  instagramAccountMetrics,
  instagramPostMetrics,
} from "../../constants/metric.js";

// Fields requested from the Instagram Graph API /{ig-user-id}/media endpoint
// Note: Instagram posts are fetched through the Facebook Graph API domain
// because Instagram Business accounts are managed via a linked Facebook Page.
const FIELDS = [
  "id",
  "caption",
  "media_type",
  "media_url",
  "thumbnail_url",
  "permalink",
  "timestamp",
  "like_count",
  "comments_count",
].join(",");

export default class InstagramService extends BaseSocialService {
  async fetchRawPosts({ limit = 25 } = {}) {
    const { igUserId, accessToken } = this.account;
    if (!igUserId || !accessToken) {
      throw new ApiError(
        400,
        "Instagram account is missing igUserId or accessToken",
      );
    }

    const url = `https://graph.facebook.com/${env.instagram.graphVersion}/${igUserId}/media`;

    try {
      const { data } = await axios.get(url, {
        params: { fields: FIELDS, limit, access_token: accessToken },
      });
      return data?.data ?? [];
    } catch (err) {
      const message = err.response?.data?.error?.message || err.message;
      throw new ApiError(
        err.response?.status || 502,
        `Instagram API error: ${message}`,
      );
    }
  }

  normalizePost(raw) {
    return {
      platform: PLATFORMS.INSTAGRAM,
      externalId: raw.id,
      accountRef: this.account._id,
      author: this.account.displayName || this.account.igUserId,
      message: raw.caption || "",
      mediaType: (raw.media_type || "image").toLowerCase(),
      mediaUrl: raw.media_url || raw.thumbnail_url || null,
      permalink: raw.permalink || null,
      likeCount: raw.like_count || 0,
      commentCount: raw.comments_count || 0,
      publishedAt: raw.timestamp ? new Date(raw.timestamp) : new Date(),
      raw,
    };
  }

  /** Comments on a single media item, via the dedicated /comments edge. */
  async fetchComments(mediaExternalId) {
    const { accessToken } = this.account;
    const url = `https://graph.facebook.com/${env.instagram.graphVersion}/${mediaExternalId}/comments`;
    try {
      const { data } = await axios.get(url, {
        params: {
          fields: "id,text,username,timestamp,like_count",
          access_token: accessToken,
        },
      });
      return data?.data ?? [];
    } catch (err) {
      const message = err.response?.data?.error?.message || err.message;
      throw new ApiError(
        err.response?.status || 502,
        `Instagram comments error: ${message}`,
      );
    }
  }

  normalizeComment(raw, postRef) {
    return {
      platform: PLATFORMS.INSTAGRAM,
      externalId: raw.id,
      postRef,
      authorUsername: raw.username || "Unknown",
      message: raw.text || "",
      likeCount: raw.like_count || 0,
      publishedAt: raw.timestamp ? new Date(raw.timestamp) : new Date(),
      raw,
    };
  }

  /**
   * Media-level insights. Meta deprecated 'impressions'/'video_views' in
   * Graph API v22.0 - 'views' replaces both. If this starts erroring with
   * "must be a valid insights metric", check the current list at:
   * https://developers.facebook.com/docs/instagram-platform/insights
   */
  async fetchInsights(mediaExternalId) {
    const { accessToken } = this.account;
    // const metrics = ["views", "reach", "saved", "shares"];
    const url = `https://graph.facebook.com/${env.instagram.graphVersion}/${mediaExternalId}/insights`;
    try {
      const { data } = await axios.get(url, {
        params: {
          metric: instagramPostMetrics.join(","),
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
        `Instagram insights error: ${message}`,
      );
    }
  }

  /**
   * Account-level ("Overview" tab equivalent) stats. views/accounts_engaged/
   * total_interactions require metric_type=total_value as of the current
   * API - without it, Meta rejects the whole request (confirmed via the
   * exact error message this endpoint returns). reach still works either
   * way, so total_value is used for everything here for consistency.
   */
  async fetchAccountInsights() {
    const { igUserId, accessToken } = this.account;
    // const metrics = [
    //   "views",
    //   "reach",
    //   "accounts_engaged",
    //   "total_interactions",
    // ];
    const insightsUrl = `https://graph.facebook.com/${env.instagram.graphVersion}/${igUserId}/insights`;
    const fieldsUrl = `https://graph.facebook.com/${env.instagram.graphVersion}/${igUserId}`;

    const result = {};
    const errors = [];

    try {
      const { data } = await axios.get(insightsUrl, {
        params: {
          metric: instagramAccountMetrics.join(","),
          period: "day",
          metric_type: "total_value",
          access_token: accessToken,
        },
      });
      (data?.data ?? []).forEach((m) => {
        // total_value shape is { total_value: { value: N } }; fall back to
        // the old time-series 'values' array shape just in case a given
        // metric doesn't support total_value on some accounts.
        result[m.name] =
          m.total_value?.value ??
          (m.values ?? []).reduce((sum, v) => sum + (v.value || 0), 0);
      });
    } catch (err) {
      errors.push(
        `${instagramAccountMetrics.join(",")}: ${err.response?.data?.error?.message || err.message}`,
      );
    }

    try {
      const { data } = await axios.get(fieldsUrl, {
        params: {
          fields: "followers_count,media_count",
          access_token: accessToken,
        },
      });
      result.followers_count = data?.followers_count ?? 0;
      result.media_count = data?.media_count ?? 0;
    } catch (err) {
      errors.push(
        `followers_count: ${err.response?.data?.error?.message || err.message}`,
      );
    }

    return { metrics: result, errors };
  }
}
