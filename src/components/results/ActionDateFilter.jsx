import { useMemo, useState, useEffect } from "react";
import "./ActionDateFilter.css";

/**
 * Filtre date inline pour les actions.
 * Affiche : Du / Au + compteur + Reset
 */
export default function ActionDateFilter({ actions, onFiltered, label = "actions" }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const parseActionDate = (d) => {
    if (!d) return null;
    if (d instanceof Date) return isNaN(d) ? null : d;
    const s = String(d).trim();
    let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
    m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
    const dd = new Date(s);
    return isNaN(dd) ? null : dd;
  };

  const filtered = useMemo(() => {
    return actions.filter((a) => {
      const d = parseActionDate(a.date);
      if (!d) return !from && !to;
      if (from && d < new Date(from)) return false;
      if (to && d > new Date(to + "T23:59:59")) return false;
      return true;
    });
  }, [actions, from, to]);

  // ✅ Fix : utiliser useEffect au lieu de useMemo pour notifier le parent
  useEffect(() => {
    if (onFiltered) onFiltered(filtered);
  }, [filtered, onFiltered]);

  return (
    <div className="action-date-filter">
      <div className="adf-field">
        <label>Du</label>
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />
      </div>
      <div className="adf-field">
        <label>Au</label>
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
      </div>
      <div className="adf-info">
        <strong>{filtered.length}</strong> {label}
      </div>
      {(from || to) && (
        <button
          type="button"
          className="adf-reset"
          onClick={() => { setFrom(""); setTo(""); }}
        >
          ×
        </button>
      )}
    </div>
  );
}
