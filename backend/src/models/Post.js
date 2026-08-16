import mongoose from "mongoose";
import { PLATFORM_LIST } from "../constants/platforms.js";

const { Schema } = mongoose;

const postSchema = new Schema(
  {
    platform: { type: String, enum: PLATFORM_LIST, required: true },
    // The post's ID on the source platform (Facebook post id / IG media id)
    externalId: { type: String, required: true },
    accountRef: {
      type: Schema.Types.ObjectId,
      ref: "SocialAccount",
      required: true,
    },
    author: { type: String, default: "" },
    message: { type: String, default: "" },
    mediaType: { type: String, default: "status" },
    mediaUrl: { type: String, default: null },
    permalink: { type: String, default: null },
    likeCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
    publishedAt: { type: Date, required: true },
    // Raw platform payload kept for debugging/future fields, excluded by default
    raw: { type: Schema.Types.Mixed, select: false },
    // Latest snapshot from fetchInsights() - reaction breakdown (Facebook)
    // or views/reach/saved/shares (Instagram). Not a history, just the
    // most recent pull - call POST /posts/:id/insights/sync to refresh it.
    insights: { type: Schema.Types.Mixed, default: {} },
    insightsUpdatedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// A post is uniquely identified by platform + its ID on that platform.
// This also makes upserts in PostService's bulkWrite idempotent.
postSchema.index({ platform: 1, externalId: 1 }, { unique: true });
postSchema.index({ publishedAt: -1 });

export default mongoose.model("Post", postSchema);
