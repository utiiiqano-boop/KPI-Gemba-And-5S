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

export function DateRange({ from, to, onFrom, onTo, months = [] }) {
  return (
    <>
      <div className="filter-field">
        <label>Mois du</label>
        <select
          value={from === "" ? "__all__" : from}
          onChange={(e) => onFrom(e.target.value === "__all__" ? "" : e.target.value)}
        >
          <option value="__all__">Tous</option>
          {months.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>
      <div className="filter-field">
        <label>au</label>
        <select
          value={to === "" ? "__all__" : to}
          onChange={(e) => onTo(e.target.value === "__all__" ? "" : e.target.value)}
        >
          <option value="__all__">—</option>
          {months.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
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