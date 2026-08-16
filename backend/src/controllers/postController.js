import asyncHandler from "../middlewares/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import PostService from "../services/PostService.js";

export const getPosts = asyncHandler(async (req, res) => {
  const { platform, page, limit, search } = req.query;
  const result = await PostService.getPosts({ platform, page, limit, search });
  new ApiResponse(200, result, "Posts fetched successfully").send(res);
});

export const getPostById = asyncHandler(async (req, res) => {
  const post = await PostService.getPostById(req.params.id);
  new ApiResponse(200, post, "Post fetched successfully").send(res);
});

export const syncAccountPosts = asyncHandler(async (req, res) => {
  const posts = await PostService.syncAccount(req.params.accountId);
  new ApiResponse(200, posts, "Posts synced successfully").send(res);
});

export const syncAllPosts = asyncHandler(async (req, res) => {
  const { platform } = req.query;
  const result = await PostService.syncAll({ platform });
  new ApiResponse(200, result, "Sync triggered for all accounts").send(res);
});

export const getComments = asyncHandler(async (req, res) => {
  const comments = await PostService.getComments(req.params.id);
  new ApiResponse(200, comments, "Comments fetched successfully").send(res);
});

export const syncComments = asyncHandler(async (req, res) => {
  const comments = await PostService.syncComments(req.params.id);
  new ApiResponse(200, comments, "Comments synced successfully").send(res);
});

export const syncInsights = asyncHandler(async (req, res) => {
  const post = await PostService.syncInsights(req.params.id);
  new ApiResponse(200, post, "Insights synced successfully").send(res);
});
