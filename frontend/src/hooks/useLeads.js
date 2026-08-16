import { useCallback, useEffect, useState } from 'react';
import leadApi from '../api/leadApi.js';

/**
 * Mirrors usePosts.js - same fetch/loading/error shape, applied to leads
 * instead of posts. Kept as a separate hook (rather than a generic one)
 * since leads and posts have different filters (status/source vs platform).
 */
export default function useLeads({ platform, status } = {}) {
  const [leads, setLeads] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLeads = useCallback(
    async (page = 1) => {
      setLoading(true);
      setError(null);
      try {
        const res = await leadApi.getLeads({ platform, status, page });
        setLeads(res.data.leads);
        setPagination(res.data.pagination);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [platform, status]
  );

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const markStatus = useCallback(async (id, newStatus) => {
    await leadApi.updateStatus(id, newStatus);
    setLeads((prev) => prev.map((l) => (l._id === id ? { ...l, status: newStatus } : l)));
  }, []);

  return { leads, pagination, loading, error, refetch: fetchLeads, markStatus };
}
