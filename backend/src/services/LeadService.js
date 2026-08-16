import Lead, { LEAD_SOURCES } from '../models/Lead.js';
import WatchedHashtag from '../models/WatchedHashtag.js';
import SocialAccount from '../models/SocialAccount.js';
import ListenerServiceFactory from './listening/ListenerServiceFactory.js';
import { PLATFORMS } from '../constants/platforms.js';
import ApiError from '../utils/ApiError.js';

const HASHTAG_QUOTA = 30; // Meta's hard limit: unique hashtags per rolling window
const QUOTA_WINDOW_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export default class LeadService {
  // ---------- Instagram hashtag watching ----------

  static async addWatchedHashtag(igAccountId, tag) {
    const account = await SocialAccount.findOne({ _id: igAccountId, platform: PLATFORMS.INSTAGRAM });
    if (!account) throw new ApiError(404, 'Instagram account not found');

    const normalizedTag = tag.trim().toLowerCase().replace(/^#/, '');

    return WatchedHashtag.findOneAndUpdate(
      { igAccountRef: account._id, tag: normalizedTag },
      { $setOnInsert: { igAccountRef: account._id, tag: normalizedTag } },
      { upsert: true, new: true }
    );
  }

  static async listWatchedHashtags(igAccountId) {
    return WatchedHashtag.find({ igAccountRef: igAccountId, isActive: true });
  }

  /**
   * Runs a hashtag sweep for ONE Instagram account: queries every active
   * watched hashtag that is still within Meta's 30-unique-hashtags/7-days
   * quota, saves any new posts as Leads, and skips (with a reported
   * reason) any hashtag that would exceed the quota.
   */
  static async runHashtagSweep(igAccountId) {
    const account = await SocialAccount.findById(igAccountId).select('+accessToken');
    if (!account) throw new ApiError(404, 'Instagram account not found');

    const watched = await WatchedHashtag.find({ igAccountRef: account._id, isActive: true });

    const windowStart = new Date(Date.now() - QUOTA_WINDOW_MS);
    const withinQuotaCount = watched.filter(
      (w) => w.firstQueriedAt && w.firstQueriedAt > windowStart
    ).length;

    const listener = ListenerServiceFactory.create(account);
    const results = [];
    let usedSlots = withinQuotaCount;

    for (const hashtag of watched) {
      const alreadyCountedTowardQuota = hashtag.firstQueriedAt && hashtag.firstQueriedAt > windowStart;

      if (!alreadyCountedTowardQuota && usedSlots >= HASHTAG_QUOTA) {
        results.push({ tag: hashtag.tag, status: 'skipped', reason: 'weekly hashtag quota reached' });
        // eslint-disable-next-line no-continue
        continue;
      }

      try {
        // eslint-disable-next-line no-await-in-loop
        const leads = await listener.getLeadsForTerm(hashtag.tag);
        // eslint-disable-next-line no-await-in-loop
        const saved = await LeadService.#bulkUpsertLeads(leads);

        hashtag.lastQueriedAt = new Date();
        hashtag.lastResultCount = leads.length;
        if (!alreadyCountedTowardQuota) {
          hashtag.firstQueriedAt = hashtag.firstQueriedAt || new Date();
          usedSlots += 1;
        }
        // eslint-disable-next-line no-await-in-loop
        await hashtag.save();

        results.push({ tag: hashtag.tag, status: 'ok', found: leads.length, saved });
      } catch (err) {
        results.push({ tag: hashtag.tag, status: 'error', reason: err.message });
      }
    }

    return results;
  }

  // ---------- Facebook mentions (pushed via webhook, not polled) ----------

  /**
   * Called by webhooks/facebookWebhookController.js when Meta pushes a
   * "your Page was mentioned" event. This is the ONLY way Facebook leads
   * enter the system - there is no equivalent runXSweep() for Facebook.
   */
  static async recordFacebookMention(mentionPayload) {
    const lead = {
      platform: PLATFORMS.FACEBOOK,
      source: LEAD_SOURCES.MENTION,
      matchedTerm: null, // Facebook mentions aren't keyword-matched, just tag-based
      externalId: mentionPayload.postId || mentionPayload.commentId,
      authorUsername: mentionPayload.senderName || '',
      authorProfileUrl: null,
      message: mentionPayload.message || '',
      mediaUrl: null,
      permalink: mentionPayload.link || null,
      capturedAt: new Date(),
      raw: mentionPayload,
    };
    return LeadService.#bulkUpsertLeads([lead]);
  }

  // ---------- Shared read/update API ----------

  static async getLeads({ platform, source, status, page = 1, limit = 20 } = {}) {
    const query = {};
    if (platform) query.platform = platform;
    if (source) query.source = source;
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [leads, total] = await Promise.all([
      Lead.find(query).sort({ capturedAt: -1 }).skip(skip).limit(Number(limit)),
      Lead.countDocuments(query),
    ]);

    return {
      leads,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }

  static async updateLeadStatus(id, status) {
    const lead = await Lead.findByIdAndUpdate(id, { status }, { new: true });
    if (!lead) throw new ApiError(404, 'Lead not found');
    return lead;
  }

  // ---------- private ----------

  static async #bulkUpsertLeads(leads) {
    if (leads.length === 0) return 0;

    const bulkOps = leads.map((lead) => ({
      updateOne: {
        filter: { platform: lead.platform, source: lead.source, externalId: lead.externalId },
        update: { $setOnInsert: lead },
        upsert: true,
      },
    }));

    const result = await Lead.bulkWrite(bulkOps);
    return result.upsertedCount;
  }
}
