import { useState } from "react";
import postApi from "../api/postApi.js";
import socialAccountApi from "../api/socialAccountApi.js";
import HashtagManager from "./HashtagManager.jsx";

export default function AccountCard({ account, onDelete }) {
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState(null);
  const [showHashtags, setShowHashtags] = useState(false);
  const [insights, setInsights] = useState(
    account.accountInsights?.metrics || null,
  );
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [insightsError, setInsightsError] = useState(null);

  const hasInsights = insights && Object.keys(insights).length > 0;

  const handleSync = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const res = await postApi.syncAccount(account._id);
      setSyncMessage(`Synced - ${res.data.length} posts in database now.`);
    } catch (err) {
      setSyncMessage(`Sync failed: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleLoadInsights = async () => {
    setLoadingInsights(true);
    setInsightsError(null);
    try {
      const res = await socialAccountApi.syncInsights(account._id);
      setInsights(res.data.accountInsights?.metrics);
    } catch (err) {
      setInsightsError(err.message);
    } finally {
      setLoadingInsights(false);
    }
  };

  const handleDelete = () => {
    // eslint-disable-next-line no-alert
    if (
      window.confirm(
        `Remove ${account.displayName || account.platform} account?`,
      )
    ) {
      onDelete(account._id);
    }
  };

  return (
    <article className={`account-card account-card--${account.platform}`}>
      <header className="account-card__header">
        <span className="account-card__badge">{account.platform}</span>
        <span className="account-card__name">
          {account.displayName || "(no name)"}
        </span>
        <span className="account-card__id">
          {account.platform === "facebook" ? account.pageId : account.igUserId}
        </span>
      </header>

      <div className="account-card__meta">
        {account.lastSyncedAt
          ? `Last synced: ${new Date(account.lastSyncedAt).toLocaleString()}`
          : "Never synced"}
      </div>

      <div className="account-card__actions">
        <button type="button" onClick={handleSync} disabled={syncing}>
          {syncing ? "Syncing..." : "Sync posts now"}
        </button>
        <button
          type="button"
          onClick={handleLoadInsights}
          disabled={loadingInsights}
        >
          {loadingInsights ? "Loading..." : "Load account insights"}
        </button>
        {account.platform === "instagram" && (
          <button type="button" onClick={() => setShowHashtags((v) => !v)}>
            {showHashtags ? "Hide hashtags" : "Manage hashtags"}
          </button>
        )}
        <button
          type="button"
          className="account-card__delete"
          onClick={handleDelete}
        >
          Delete
        </button>
      </div>

      {syncMessage && (
        <p className="account-card__sync-message">{syncMessage}</p>
      )}
      {insightsError && (
        <p className="error-state account-card__sync-message">
          {insightsError}
        </p>
      )}

      {hasInsights && (
        <div className="account-card__insights">
          {Object.entries(insights).map(([key, value]) => (
            <span key={key} className="post-card__insight-chip">
              {key.replace(/_/g, " ")}: {value}
            </span>
          ))}
        </div>
      )}

      {account.platform === "instagram" && showHashtags && (
        <HashtagManager accountId={account._id} />
      )}
    </article>
  );
}
