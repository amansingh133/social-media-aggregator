import { useCallback, useEffect, useState } from 'react';
import leadApi from '../api/leadApi.js';

export default function HashtagManager({ accountId }) {
  const [hashtags, setHashtags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [sweeping, setSweeping] = useState(false);
  const [sweepResults, setSweepResults] = useState(null);
  const [error, setError] = useState(null);

  const fetchHashtags = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await leadApi.listWatchedHashtags(accountId);
      setHashtags(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    fetchHashtags();
  }, [fetchHashtags]);

  const handleAddTag = async (e) => {
    e.preventDefault();
    if (!newTag.trim()) return;
    setAdding(true);
    setError(null);
    try {
      await leadApi.addWatchedHashtag(accountId, newTag.trim());
      setNewTag('');
      await fetchHashtags();
    } catch (err) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleSweep = async () => {
    setSweeping(true);
    setSweepResults(null);
    setError(null);
    try {
      const res = await leadApi.runSweep(accountId);
      setSweepResults(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSweeping(false);
    }
  };

  return (
    <div className="hashtag-manager">
      <h3 className="hashtag-manager__title">Watched hashtags</h3>

      {loading ? (
        <p className="hashtag-manager__hint">Loading...</p>
      ) : hashtags.length === 0 ? (
        <p className="hashtag-manager__hint">No hashtags watched yet.</p>
      ) : (
        <ul className="hashtag-manager__list">
          {hashtags.map((h) => (
            <li key={h._id}>
              #{h.tag}
              {h.lastQueriedAt && (
                <span className="hashtag-manager__meta">
                  last checked {new Date(h.lastQueriedAt).toLocaleString()} ({h.lastResultCount} found)
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      <form className="hashtag-manager__add" onSubmit={handleAddTag}>
        <input
          type="text"
          placeholder="hashtag (without #)"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
        />
        <button type="submit" disabled={adding}>
          {adding ? 'Adding...' : 'Add'}
        </button>
      </form>

      <button
        type="button"
        className="hashtag-manager__sweep-btn"
        onClick={handleSweep}
        disabled={sweeping || hashtags.length === 0}
      >
        {sweeping ? 'Sweeping...' : 'Run sweep now'}
      </button>

      {error && <p className="error-state">{error}</p>}

      {sweepResults && (
        <ul className="hashtag-manager__results">
          {sweepResults.map((r) => (
            <li key={r.tag} className={`hashtag-manager__result hashtag-manager__result--${r.status}`}>
              <strong>#{r.tag}</strong> — {r.status}
              {r.status === 'ok' && ` (${r.found} found, ${r.saved} new)`}
              {r.reason && `: ${r.reason}`}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
