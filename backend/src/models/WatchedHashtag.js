import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * Instagram's Hashtag Search endpoint allows an IG Business account to
 * query only 30 UNIQUE hashtags in a rolling 7-day window. This model
 * tracks that quota so InstagramHashtagListener can enforce it instead
 * of silently failing against Meta's rate limit.
 */
const watchedHashtagSchema = new Schema(
  {
    igAccountRef: { type: Schema.Types.ObjectId, ref: 'SocialAccount', required: true },
    tag: { type: String, required: true, trim: true, lowercase: true },
    isActive: { type: Boolean, default: true },
    // Set the first time this hashtag is successfully queried; used to
    // calculate whether it still counts against the rolling 7-day quota.
    firstQueriedAt: { type: Date, default: null },
    lastQueriedAt: { type: Date, default: null },
    lastResultCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

watchedHashtagSchema.index({ igAccountRef: 1, tag: 1 }, { unique: true });

export default mongoose.model('WatchedHashtag', watchedHashtagSchema);
