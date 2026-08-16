import mongoose from "mongoose";
import { PLATFORM_LIST } from "../constants/platforms.js";

const { Schema } = mongoose;

const commentSchema = new Schema(
  {
    platform: { type: String, enum: PLATFORM_LIST, required: true },
    externalId: { type: String, required: true },
    postRef: { type: Schema.Types.ObjectId, ref: "Post", required: true },
    authorUsername: { type: String, default: "" },
    message: { type: String, default: "" },
    likeCount: { type: Number, default: 0 },
    publishedAt: { type: Date, required: true },
    raw: { type: Schema.Types.Mixed, select: false },
  },
  { timestamps: true },
);

commentSchema.index({ platform: 1, externalId: 1 }, { unique: true });
commentSchema.index({ postRef: 1, publishedAt: -1 });

export default mongoose.model("Comment", commentSchema);
