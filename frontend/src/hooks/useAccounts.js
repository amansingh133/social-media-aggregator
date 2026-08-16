import { useCallback, useEffect, useState } from 'react';
import socialAccountApi from '../api/socialAccountApi.js';

/**
 * Same fetch/loading/error shape as usePosts.js and useLeads.js, applied
 * to connected accounts - plus removeAccount(), since this is the one
 * page that also deletes things.
 */
export default function useAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await socialAccountApi.list();
      setAccounts(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const removeAccount = useCallback(async (id) => {
    await socialAccountApi.remove(id);
    setAccounts((prev) => prev.filter((a) => a._id !== id));
  }, []);

  return { accounts, loading, error, refetch: fetchAccounts, removeAccount };
}
