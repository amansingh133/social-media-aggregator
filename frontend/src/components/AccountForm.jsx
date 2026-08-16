import { useState } from 'react';
import socialAccountApi from '../api/socialAccountApi.js';

const EMPTY_FORM = { platform: 'facebook', displayName: '', accessToken: '', pageId: '', igUserId: '' };

export default function AccountForm({ onCreated }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const update = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = {
      platform: form.platform,
      displayName: form.displayName,
      accessToken: form.accessToken,
      ...(form.platform === 'facebook' ? { pageId: form.pageId } : { igUserId: form.igUserId }),
    };

    try {
      await socialAccountApi.create(payload);
      setForm(EMPTY_FORM);
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="account-form" onSubmit={handleSubmit}>
      <h2 className="account-form__title">Connect an account</h2>

      <div className="account-form__row">
        <label>
          Platform
          <select value={form.platform} onChange={update('platform')}>
            <option value="facebook">Facebook</option>
            <option value="instagram">Instagram</option>
          </select>
        </label>

        <label>
          Display name
          <input
            type="text"
            placeholder="My Page"
            value={form.displayName}
            onChange={update('displayName')}
          />
        </label>
      </div>

      <label className="account-form__full">
        Access token
        <input
          type="password"
          placeholder="Paste the Page Access Token from Graph API Explorer"
          value={form.accessToken}
          onChange={update('accessToken')}
          required
        />
      </label>

      {form.platform === 'facebook' ? (
        <label className="account-form__full">
          Facebook Page ID
          <input type="text" value={form.pageId} onChange={update('pageId')} required />
        </label>
      ) : (
        <label className="account-form__full">
          Instagram Business Account ID
          <input type="text" value={form.igUserId} onChange={update('igUserId')} required />
        </label>
      )}

      {error && <p className="error-state account-form__error">{error}</p>}

      <button type="submit" disabled={submitting}>
        {submitting ? 'Connecting...' : 'Connect account'}
      </button>
    </form>
  );
}
