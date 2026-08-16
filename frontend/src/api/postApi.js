import axiosClient from "./axiosClient.js";

const postApi = {
  getPosts: (params) => axiosClient.get("/posts", { params }),
  getPostById: (id) => axiosClient.get(`/posts/${id}`),
  syncAll: (platform) =>
    axiosClient.get("/posts/sync", { params: { platform } }),
  syncAccount: (accountId) => axiosClient.post(`/posts/sync/${accountId}`),
  getComments: (postId) => axiosClient.get(`/posts/${postId}/comments`),
  syncComments: (postId) => axiosClient.post(`/posts/${postId}/comments/sync`),
  syncInsights: (postId) => axiosClient.post(`/posts/${postId}/insights/sync`),
};

export default postApi;
