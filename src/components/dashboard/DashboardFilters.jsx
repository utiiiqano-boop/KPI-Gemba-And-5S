import "./DashboardFilters.css";

export default function DashboardFilters({
  periodType, setPeriodType,
  monthValue, setMonthValue,
  weekValue, setWeekValue,
  dateFrom, setDateFrom,
  dateTo, setDateTo,
  months = [],
  weeks = [],
}) {
  return (
    <div className="db-filters">
      <div className="db-filter-field">
        <label>Période</label>
        <select
          value={periodType}
          onChange={(e) => setPeriodType(e.target.value)}
        >
          <option value="all">Toutes les périodes</option>
          <option value="month">Par mois</option>
          <option value="week">Par semaine</option>
          <option value="range">Plage de dates</option>
        </select>
      </div>

      {periodType === "month" && (
        <div className="db-filter-field">
          <label>Mois</label>
          <select value={monthValue} onChange={(e) => setMonthValue(e.target.value)}>
            <option value="">— Sélectionner —</option>
            {months.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      )}

      {periodType === "week" && (
        <div className="db-filter-field">
          <label>Semaine</label>
          <select value={weekValue} onChange={(e) => setWeekValue(e.target.value)}>
            <option value="">— Sélectionner —</option>
            {weeks.map((w) => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>
        </div>
      )}

      {periodType === "range" && (
        <>
          <div className="db-filter-field">
            <label>Du</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="db-filter-field">
            <label>Au</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </>
      )}
    </div>
  );
}
