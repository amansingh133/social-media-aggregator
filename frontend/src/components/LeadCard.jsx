const STATUS_OPTIONS = ['new', 'contacted', 'qualified', 'ignored'];

export default function LeadCard({ lead, onStatusChange }) {
  return (
    <article className={`lead-card lead-card--${lead.platform}`}>
      <header className="lead-card__header">
        <span className="lead-card__badge">{lead.platform}</span>
        <span className="lead-card__source">
          {lead.source === 'hashtag' ? `#${lead.matchedTerm}` : lead.source}
        </span>
        <span className="lead-card__author">{lead.authorUsername || 'Unknown'}</span>
      </header>

      {lead.message && <p className="lead-card__message">{lead.message}</p>}

      <footer className="lead-card__footer">
        {lead.permalink && (
          <a href={lead.permalink} target="_blank" rel="noreferrer">
            View post
          </a>
        )}
        <select
          className="lead-card__status"
          value={lead.status}
          onChange={(e) => onStatusChange(lead._id, e.target.value)}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </footer>
    </article>
  );
}
