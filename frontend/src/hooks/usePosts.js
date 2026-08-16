import { useCallback, useEffect, useState } from 'react';
import postApi from '../api/postApi.js';

/**
 * Reusable data-fetching hook. Any page/component that needs a list of
 * posts (Home, a future "Facebook only" page, a widget, etc.) can reuse
 * this instead of duplicating fetch/loading/error state.
 */
export default function usePosts({ platform } = {}) {
  const [posts, setPosts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPosts = useCallback(
    async (page = 1) => {
      setLoading(true);
      setError(null);
      try {
        const res = await postApi.getPosts({ platform, page });
        setPosts(res.data.posts);
        setPagination(res.data.pagination);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [platform]
  );

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return { posts, pagination, loading, error, refetch: fetchPosts };
}
