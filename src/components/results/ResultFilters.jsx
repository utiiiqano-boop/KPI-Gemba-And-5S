import "./ResultFilters.css";

export default function ResultFilters({ children }) {
  return <div className="result-filters">{children}</div>;
}

export function Select({ label, value, onChange, options, allLabel = "Tous" }) {
  return (
    <div className="filter-field">
      <label>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{allLabel}</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

export function DateRange({ from, to, onFrom, onTo }) {
  return (
    <>
      <div className="filter-field">
        <label>Du</label>
        <input type="date" value={from} onChange={(e) => onFrom(e.target.value)} />
      </div>
      <div className="filter-field">
        <label>Au</label>
        <input type="date" value={to} onChange={(e) => onTo(e.target.value)} />
      </div>
    </>
  );
}

export function ResetButton({ onClick, disabled }) {
  return (
    <button className="filter-reset" onClick={onClick} disabled={disabled}>
      Réinitialiser
    </button>
  );
}
