import axios from 'axios';
import BaseListenerService from './BaseListenerService.js';
import { env } from '../../config/env.js';
import { PLATFORMS } from '../../constants/platforms.js';
import { LEAD_SOURCES } from '../../models/Lead.js';
import ApiError from '../../utils/ApiError.js';

const MEDIA_FIELDS = [
  'id',
  'caption',
  'permalink',
  'media_url',
  'media_type',
  'timestamp',
  'like_count',
  'comments_count',
  'username',
].join(',');

/**
 * Uses Instagram's Hashtag Search endpoints:
 *   1. GET /ig_hashtag_search?q={tag}          -> resolves tag to a hashtag ID
 *   2. GET /{hashtag-id}/recent_media           -> public posts using that tag
 *
 * IMPORTANT REAL LIMITS (not a bug in this code - a Meta platform rule):
 *   - Only public accounts' posts are returned. Private accounts using
 *     the hashtag are invisible to this endpoint entirely.
 *   - An IG Business account can query a maximum of 30 UNIQUE hashtags
 *     in any rolling 7-day window. Quota enforcement lives in
 *     LeadService.runHashtagSweep(), not here - this class only makes
 *     the calls it's told to make.
 *   - "recent_media" is capped at the ~50 most recent public posts; it
 *     is NOT a full historical search.
 */
export default class InstagramHashtagListener extends BaseListenerService {
  async resolveHashtagId(tag) {
    const { igUserId, accessToken } = this.account;
    if (!igUserId || !accessToken) {
      throw new ApiError(400, 'Instagram account is missing igUserId or accessToken');
    }

    const url = `https://graph.facebook.com/${env.instagram.graphVersion}/ig_hashtag_search`;

    try {
      const { data } = await axios.get(url, {
        params: { user_id: igUserId, q: tag, access_token: accessToken },
      });
      const hashtagId = data?.data?.[0]?.id;
      if (!hashtagId) {
        throw new ApiError(404, `No Instagram hashtag found for "${tag}"`);
      }
      return hashtagId;
    } catch (err) {
      if (err instanceof ApiError) throw err;
      const message = err.response?.data?.error?.message || err.message;
      throw new ApiError(err.response?.status || 502, `Instagram hashtag lookup failed: ${message}`);
    }
  }

  async searchRaw(tag) {
    const { igUserId, accessToken } = this.account;
    const hashtagId = await this.resolveHashtagId(tag);
    const url = `https://graph.facebook.com/${env.instagram.graphVersion}/${hashtagId}/recent_media`;

    try {
      const { data } = await axios.get(url, {
        params: { user_id: igUserId, fields: MEDIA_FIELDS, access_token: accessToken },
      });
      return data?.data ?? [];
    } catch (err) {
      const message = err.response?.data?.error?.message || err.message;
      throw new ApiError(err.response?.status || 502, `Instagram hashtag media fetch failed: ${message}`);
    }
  }

  normalizeLead(raw, term) {
    return {
      platform: PLATFORMS.INSTAGRAM,
      source: LEAD_SOURCES.HASHTAG,
      matchedTerm: term,
      externalId: raw.id,
      authorUsername: raw.username || '',
      authorProfileUrl: raw.username ? `https://instagram.com/${raw.username}` : null,
      message: raw.caption || '',
      mediaUrl: raw.media_url || null,
      permalink: raw.permalink || null,
      capturedAt: raw.timestamp ? new Date(raw.timestamp) : new Date(),
      raw,
    };
  }
}
