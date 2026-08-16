import mongoose from "mongoose";
import { PLATFORM_LIST } from "../constants/platforms.js";

const { Schema } = mongoose;

const socialAccountSchema = new Schema(
  {
    platform: {
      type: String,
      enum: PLATFORM_LIST,
      required: true,
    },
    displayName: { type: String, trim: true },
    // select: false keeps the token out of default query results
    accessToken: { type: String, required: true, select: false },
    tokenExpiresAt: { type: Date },
    // Facebook Page ID (required when platform === 'facebook')
    pageId: { type: String },
    // Instagram Business Account ID (required when platform === 'instagram')
    igUserId: { type: String },
    isActive: { type: Boolean, default: true },
    lastSyncedAt: { type: Date },
    // Latest "Overview tab" style account-level stats snapshot - views,
    // reach, follower count, etc. Not a history, just the most recent
    // pull - call POST /social-accounts/:id/insights/sync to refresh it.
    accountInsights: { type: Schema.Types.Mixed, default: {} },
    accountInsightsUpdatedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

socialAccountSchema.index({ platform: 1, pageId: 1, igUserId: 1 });

export default mongoose.model("SocialAccount", socialAccountSchema);
