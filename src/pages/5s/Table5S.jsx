import { useMemo, useState, useEffect } from "react";
import { useRealtimeList } from "../../hooks/useFirebaseData";
import {
  PILLARS,
  get5SDate, get5SZone, get5SAuditor, get5SZoneLeader, get5STotal,
  get5SAnswers, get5SScore,
} from "../../utils/analytics";
import ResultsTable from "../../components/results/ResultsTable";
import ExportButton from "../../components/report/ExportButton";
import SinglePage5SReport from "../../components/report/SinglePage5SReport";
import { scoreColor } from "../../utils/colors";
import ResultFilters, { Select, DateRange, ResetButton } from "../../components/results/ResultFilters";
import "../../pages/Results.css";

export default function Table5S() {
  const { data: records, loading } = useRealtimeList("5s_audits");
  const [reportRecord, setReportRecord] = useState(null);

  const [zone, setZone] = useState("");
  const [auditor, setAuditor] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [showAll, setShowAll] = useState(false);

  useEffect(() => { setFrom(""); setTo(""); }, []);

  const monthsList = useMemo(() => {
    const set = new Set();
    records.forEach((r) => {
      const d = get5SDate(r);
      if (d) {
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        set.add(key);
      }
    });
    return [...set].sort().reverse();
  }, [records]);

  const zones = useMemo(
    () => [...new Set(records.map(get5SZone).filter((z) => z && z !== "—"))].sort(),
    [records]
  );
  const auditors = useMemo(
    () => [...new Set(records.map(get5SAuditor).filter((a) => a && a !== "—"))].sort(),
    [records]
  );

  const rows = useMemo(() => {
    return records
      .filter((r) => {
        const z = get5SZone(r);
        const a = get5SAuditor(r);
        const d = get5SDate(r);
        if (zone && z !== zone) return false;
        if (auditor && a !== auditor) return false;
        if (d) {
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          if (from && key < from) return false;
          if (to && key > to) return false;
        } else if (from || to) {
          return false;
        }
        return true;
      })
      .map((r) => {
        const d = get5SDate(r);
        const s = get5SScore(r);
        const ans = get5SAnswers(r);
        const pillarPoints = {};
        PILLARS.forEach((p) => {
          pillarPoints[p] = ans
            .filter((x) => x.pillar === p)
            .reduce((acc, x) => acc + Number(x.points ?? 0), 0);
        });
        const qStatus = {};
        for (let i = 1; i <= 26; i++) {
          const a = ans.find((x) => x.index === i);
          qStatus[`q${i}`] = a?.status || "N/A";
        }
        return {
          _id: r._id,
          dateLabel: d ? d.toLocaleDateString("fr-FR") : "—",
          dateTs: d ? d.getTime() : 0,
          zone: get5SZone(r),
          auditor: get5SAuditor(r),
          zoneLeader: get5SZoneLeader(r),
          ok: s.ok, nok: s.nok, na: s.na,
          applicable: s.applicable,
          score: s.percent,
          ...pillarPoints,
          ...qStatus,
        };
      })
      .sort((a, b) => b.dateTs - a.dateTs);
  }, [records, zone, auditor, from, to]);

  const reset = () => { setZone(""); setAuditor(""); setFrom(""); setTo(""); };
  const hasFilter = zone || auditor || from || to;

  const qPill = (v) => {
    const cls = v === "OK" ? "pill-OK" : v === "NOK" ? "pill-NOK" : "pill-NA";
    return <span className={`pill ${cls}`}>{v}</span>;
  };

  const baseColumns = [
    { key: "dateLabel", label: "Date", sortValue: (r) => r.dateTs, width: 105 },
    { key: "zone", label: "Zone/Ligne", width: 120 },
    { key: "auditor", label: "Auditeur", width: 150 },
    { key: "zoneLeader", label: "Pilot de zone", width: 140 },
    { key: "ok", label: "OK", align: "center", width: 55, sortValue: (r) => r.ok,
      render: (r) => <span style={{ color: "#86efac", fontWeight: 600 }}>{r.ok}</span> },
    { key: "nok", label: "NOK", align: "center", width: 55, sortValue: (r) => r.nok,
      render: (r) => <span style={{ color: r.nok > 0 ? "#fca5a5" : "#64748b", fontWeight: 600 }}>{r.nok}</span> },
    { key: "na", label: "N/A", align: "center", width: 55, sortValue: (r) => r.na,
      render: (r) => <span style={{ color: "#cbd5e1", fontWeight: 600 }}>{r.na}</span> },
    { key: "applicable", label: "Appli.", align: "center", width: 75,
      sortValue: (r) => r.applicable,
      render: (r) => <span style={{ color: "#94a3b8" }}>{r.applicable}</span> },
    { key: "score", label: "Score %", align: "center", width: 90,
      sortValue: (r) => r.score,
      render: (r) => (
        <strong style={{ color: scoreColor(r.score) }}>
          {Number(r.score).toFixed(1)}%
        </strong>
      ) },
    { key: "_actions", label: "Rapport", align: "center", width: 100,
      render: (r) => {
        const original = records.find((x) => x._id === r._id);
        if (!original) return null;
        return (
          <button
            onClick={() => setReportRecord(original)}
            style={{
              padding: "6px 12px",
              background: "#4f46e5",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "12px",
            }}
          >
            📄 Voir rapport
          </button>
        );
      }
    },
  ];

  const questionColumns = Array.from({ length: 26 }, (_, i) => ({
    key: `q${i + 1}`,
    label: `Q${i + 1}`,
    align: "center",
    width: 48,
    render: (r) => qPill(r[`q${i + 1}`]),
  }));

  const columns = showAll ? [...baseColumns, ...questionColumns] : baseColumns;

  return (
    <div className="results-page">
      <ResultFilters>
        <Select label="Zone/Ligne" value={zone} onChange={setZone} options={zones} />
        <Select label="Auditeur" value={auditor} onChange={setAuditor} options={auditors} />
        <DateRange from={from} to={to} onFrom={setFrom} onTo={setTo} months={monthsList} />
        <button
          type="button"
          className="filter-reset"
          style={{
            background: "rgba(99,102,241,0.15)",
            color: "#a5b4fc",
            borderColor: "rgba(99,102,241,0.4)",
          }}
          onClick={() => setShowAll((v) => !v)}
        >
          {showAll ? "Masquer Q1–Q26" : "Afficher Q1–Q26"}
        </button>
        <ResetButton onClick={reset} disabled={!hasFilter} />
      </ResultFilters>

      {loading ? (
        <div className="rt-wrap"><div className="rt-empty">Chargement…</div></div>
      ) : (
        <ResultsTable
          columns={columns}
          rows={rows}
          initialSort={{ key: "dateLabel", dir: "desc" }}
          pageSize={30}
          emptyMessage="Aucun audit 5S pour ces filtres."
        />
      )}
    
      {/* MODALE DU RAPPORT */}
      {reportRecord && (
        <div
          id="report-modal"
          style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.8)",
            // ID pour cibler l'impression
            zIndex: 9999,
            overflow: "auto",
            padding: "20px",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setReportRecord(null);
          }}
        >
          <div style={{ maxWidth: "900px", margin: "0 auto", background: "white", borderRadius: "8px", padding: "10px" }}>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginBottom: "10px" }}>
              <ExportButton
                fileName={`audit-5S-${reportRecord?.meta?.zone || "zone"}-${reportRecord?.meta?.date || ""}.pdf`}
                label="📄 Télécharger PDF"
              />
              <button
                onClick={() => setReportRecord(null)}
                style={{
                  padding: "8px 16px",
                  background: "#64748b",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                ✕ Fermer
              </button>
            </div>
            <SinglePage5SReport record={reportRecord} />
          </div>
        </div>
      )}
</div>
  );
}