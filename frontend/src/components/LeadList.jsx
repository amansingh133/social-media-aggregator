import LeadCard from './LeadCard.jsx';

export default function LeadList({ leads, onStatusChange }) {
  if (leads.length === 0) {
    return <p className="empty-state">No leads captured yet.</p>;
  }

  return (
    <div className="lead-list">
      {leads.map((lead) => (
        <LeadCard key={lead._id} lead={lead} onStatusChange={onStatusChange} />
      ))}
    </div>
  );
}
