import axios from "axios";

// Base client shared by every resource-specific API module below.
// Centralizing baseURL/timeout/error-shaping here means individual
// api modules (postApi, socialAccountApi, ...) stay tiny and reusable.
const axiosClient = axios.create({
  baseURL: "/api/v1",
  timeout: 15000,
});

axiosClient.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const message = err.response?.data?.message || err.message;
    return Promise.reject(new Error(message));
  },
);

export default axiosClient;
