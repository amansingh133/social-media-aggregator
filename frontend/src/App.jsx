import { useState } from 'react';
import Accounts from './pages/Accounts.jsx';
import Home from './pages/Home.jsx';
import Leads from './pages/Leads.jsx';

const TABS = [
  { key: 'accounts', label: 'Accounts', Component: Accounts },
  { key: 'posts', label: 'Posts', Component: Home },
  { key: 'leads', label: 'Leads', Component: Leads },
];

export default function App() {
  const [tab, setTab] = useState('accounts');
  const ActiveTab = TABS.find((t) => t.key === tab).Component;

  return (
    <div>
      <nav className="app-nav">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`app-nav__btn ${tab === t.key ? 'active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </nav>
      <ActiveTab />
    </div>
  );
}
