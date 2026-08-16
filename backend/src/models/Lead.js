import mongoose from 'mongoose';
import { PLATFORM_LIST } from '../constants/platforms.js';

const { Schema } = mongoose;

// How this lead was discovered
export const LEAD_SOURCES = Object.freeze({
  HASHTAG: 'hashtag', // Instagram hashtag search
  MENTION: 'mention', // Facebook Page mention (via webhook)
  COMMENT: 'comment', // A comment on one of OUR OWN posts
});

export const LEAD_STATUSES = Object.freeze({
  NEW: 'new',
  CONTACTED: 'contacted',
  QUALIFIED: 'qualified',
  IGNORED: 'ignored',
});

const leadSchema = new Schema(
  {
    platform: { type: String, enum: PLATFORM_LIST, required: true },
    source: { type: String, enum: Object.values(LEAD_SOURCES), required: true },
    // The specific hashtag or keyword that surfaced this lead, e.g. "yourproduct"
    matchedTerm: { type: String, default: null },
    // The platform's ID for this post/comment/mention - used for de-duplication
    externalId: { type: String, required: true },
    authorUsername: { type: String, default: '' },
    authorProfileUrl: { type: String, default: null },
    message: { type: String, default: '' },
    mediaUrl: { type: String, default: null },
    permalink: { type: String, default: null },
    status: { type: String, enum: Object.values(LEAD_STATUSES), default: LEAD_STATUSES.NEW },
    capturedAt: { type: Date, default: Date.now },
    // Raw platform payload, kept for debugging - excluded by default
    raw: { type: Schema.Types.Mixed, select: false },
  },
  { timestamps: true }
);

// Same lead (same post/comment/mention) shouldn't be captured twice
leadSchema.index({ platform: 1, source: 1, externalId: 1 }, { unique: true });
leadSchema.index({ status: 1, capturedAt: -1 });

export default mongoose.model('Lead', leadSchema);
