import { useState } from 'react';
import useLeads from '../hooks/useLeads.js';
import LeadList from '../components/LeadList.jsx';
import Loader from '../components/Loader.jsx';

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'ignored', label: 'Ignored' },
];

export default function Leads() {
  const [status, setStatus] = useState('');
  const { leads, loading, error, refetch, markStatus } = useLeads({ status });

  return (
    <main className="home">
      <h1>Leads</h1>
      <p className="leads__hint">
        Instagram leads come from watched hashtags (poll-based). Facebook leads only
        arrive when your Page is mentioned, pushed via webhook.
      </p>

      <div className="home__toolbar">
        <div className="platform-filter">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              className={`platform-filter__btn ${status === f.value ? 'active' : ''}`}
              onClick={() => setStatus(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => refetch()}>
          Refresh
        </button>
      </div>

      {loading && <Loader />}
      {error && <p className="error-state">{error}</p>}
      {!loading && !error && <LeadList leads={leads} onStatusChange={markStatus} />}
    </main>
  );
}
