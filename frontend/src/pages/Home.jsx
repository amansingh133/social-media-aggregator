import { useState } from 'react';
import usePosts from '../hooks/usePosts.js';
import postApi from '../api/postApi.js';
import PlatformFilter from '../components/PlatformFilter.jsx';
import PostList from '../components/PostList.jsx';
import Loader from '../components/Loader.jsx';

export default function Home() {
  const [platform, setPlatform] = useState('');
  const { posts, loading, error, refetch } = usePosts({ platform });
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState(null);

  const handleSyncAll = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const res = await postApi.syncAll();
      const okCount = res.data.filter((r) => r.status === 'fulfilled').length;
      setSyncMessage(`Synced ${okCount}/${res.data.length} accounts.`);
      await refetch();
    } catch (err) {
      setSyncMessage(`Sync failed: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <main className="home">
      <h1>Social Media Aggregator</h1>
      <div className="home__toolbar">
        <PlatformFilter value={platform} onChange={setPlatform} />
        <div className="home__toolbar-buttons">
          <button type="button" onClick={handleSyncAll} disabled={syncing}>
            {syncing ? 'Syncing...' : 'Sync all accounts'}
          </button>
          <button type="button" onClick={() => refetch()}>
            Refresh
          </button>
        </div>
      </div>

      {syncMessage && <p className="home__sync-message">{syncMessage}</p>}

      {loading && <Loader />}
      {error && <p className="error-state">{error}</p>}
      {!loading && !error && <PostList posts={posts} />}
    </main>
  );
}
