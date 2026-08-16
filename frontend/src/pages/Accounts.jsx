import useAccounts from '../hooks/useAccounts.js';
import AccountForm from '../components/AccountForm.jsx';
import AccountCard from '../components/AccountCard.jsx';
import Loader from '../components/Loader.jsx';

export default function Accounts() {
  const { accounts, loading, error, refetch, removeAccount } = useAccounts();

  return (
    <main className="home">
      <h1>Connected Accounts</h1>
      <p className="leads__hint">
        Get the Access Token, Page ID, and Instagram Business Account ID from the Graph API
        Explorer (developers.facebook.com/tools/explorer/) before connecting an account.
      </p>

      <AccountForm onCreated={refetch} />

      {loading && <Loader />}
      {error && <p className="error-state">{error}</p>}
      {!loading && !error && (
        accounts.length === 0 ? (
          <p className="empty-state">No accounts connected yet.</p>
        ) : (
          <div className="account-list">
            {accounts.map((acc) => (
              <AccountCard key={acc._id} account={acc} onDelete={removeAccount} />
            ))}
          </div>
        )
      )}
    </main>
  );
}
