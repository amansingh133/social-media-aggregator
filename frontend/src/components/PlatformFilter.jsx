const PLATFORMS = [
  { value: '', label: 'All' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
];

export default function PlatformFilter({ value, onChange }) {
  return (
    <div className="platform-filter">
      {PLATFORMS.map((p) => (
        <button
          key={p.value}
          type="button"
          className={`platform-filter__btn ${value === p.value ? 'active' : ''}`}
          onClick={() => onChange(p.value)}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
