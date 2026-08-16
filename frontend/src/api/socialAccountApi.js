import axiosClient from "./axiosClient.js";

const socialAccountApi = {
  list: () => axiosClient.get("/social-accounts"),
  create: (payload) => axiosClient.post("/social-accounts", payload),
  remove: (id) => axiosClient.delete(`/social-accounts/${id}`),
  syncInsights: (id) =>
    axiosClient.post(`/social-accounts/${id}/insights/sync`),
};

export default socialAccountApi;
