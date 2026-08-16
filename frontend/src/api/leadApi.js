import axiosClient from './axiosClient.js';

const leadApi = {
  getLeads: (params) => axiosClient.get('/leads', { params }),
  updateStatus: (id, status) => axiosClient.patch(`/leads/${id}/status`, { status }),
  listWatchedHashtags: (accountId) => axiosClient.get(`/leads/watched-hashtags/${accountId}`),
  addWatchedHashtag: (accountId, tag) =>
    axiosClient.post(`/leads/watched-hashtags/${accountId}`, { tag }),
  runSweep: (accountId) => axiosClient.post(`/leads/sweep/${accountId}`),
};

export default leadApi;
