import { useMemo, useState } from "react";
import { useRealtimeList } from "../../hooks/useFirebaseData";
import { parseDate } from "../../utils/analytics";
import ResultsTable from "../../components/results/ResultsTable";
import ResultFilters, { Select, DateRange, ResetButton } from "../../components/results/ResultFilters";
import "../../pages/Results.css";

export default function TableGemba() {
  const { data: records, loading } = useRealtimeList("gemba_ojt");

  const [ligne, setLigne] = useState("");
  const [uap, setUap] = useState("");
  const [auditeur, setAuditeur] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const lignes = useMemo(() => [...new Set(records.map((r) => r.ligne).filter(Boolean))].sort(), [records]);
  const uaps = useMemo(() => [...new Set(records.map((r) => r.uap).filter(Boolean))].sort(), [records]);
  const auditeurs = useMemo(() => [...new Set(records.map((r) => r.auditeur).filter(Boolean))].sort(), [records]);

  const rows = useMemo(() => {
    return records
      .filter((r) => {
        const d = parseDate(r.date);
        if (ligne && r.ligne !== ligne) return false;
        if (uap && r.uap !== uap) return false;
        if (auditeur && r.auditeur !== auditeur) return false;
        if (from) { if (!d || d < new Date(from)) return false; }
        if (to) { if (!d || d > new Date(to)) return false; }
        return true;
      })
      .map((r, i) => {
        const d = parseDate(r.date);
        return {
          _id: r._id || i,
          dateLabel: d ? d.toLocaleDateString("fr-FR") : (r.date || "—"),
          dateTs: d ? d.getTime() : 0,
          uap: r.uap || "—",
          ligne: r.ligne || "—",
          auditeur: r.auditeur || "—",
          pointM: r.pointM || "—",
          question: r.question || "—",
          reponse: r.reponse || "—",
          action: r.actionCorrective || "—",
          pilote: r.pilote || "—",
          dateAction: r.dateAction || "—",
          score: Number(r.score ?? 0),
        };
      })
      .sort((a, b) => b.dateTs - a.dateTs);
  }, [records, ligne, uap, auditeur, from, to]);

  const reset = () => { setLigne(""); setUap(""); setAuditeur(""); setFrom(""); setTo(""); };
  const hasFilter = ligne || uap || auditeur || from || to;

  const columns = [
    { key: "dateLabel", label: "Date", sortValue: (r) => r.dateTs, width: 110 },
    { key: "uap", label: "UAP", width: 90 },
    { key: "ligne", label: "Ligne", width: 110 },
    { key: "auditeur", label: "Auditeur", width: 160 },
    { key: "pointM", label: "Point M", width: 140 },
    { key: "question", label: "Question", width: 240, wrap: true },
    { key: "reponse", label: "Réponse", align: "center", width: 90,
      render: (r) => {
        const s = String(r.reponse).toUpperCase();
        const cls = s === "OK" ? "pill-OK" : s === "NOK" ? "pill-NOK" : "pill-NA";
        return <span className={`pill ${cls}`}>{r.reponse}</span>;
      } },
    { key: "action", label: "Action corrective", width: 300, wrap: true,
      render: (r) => (r.action && r.action !== "-" && r.action !== "—") ? r.action : "—" },
    { key: "pilote", label: "Pilote", width: 110 },
    { key: "dateAction", label: "Échéance", width: 100 },
    { key: "score", label: "Score %", align: "center", width: 85, sortValue: (r) => r.score,
      render: (r) => (
        <span style={{ color: r.score >= 90 ? "#86efac" : r.score >= 75 ? "#fde047" : "#fca5a5", fontWeight: 600 }}>
          {r.score.toFixed(1)}
        </span>
      ) },
  ];

  return (
    <div className="results-page">
      <ResultFilters>
        <Select label="Ligne" value={ligne} onChange={setLigne} options={lignes} />
        <Select label="UAP" value={uap} onChange={setUap} options={uaps} />
        <Select label="Auditeur" value={auditeur} onChange={setAuditeur} options={auditeurs} />
        <DateRange from={from} to={to} onFrom={setFrom} onTo={setTo} />
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
          emptyMessage="Aucune ligne Gemba pour ces filtres."
        />
      )}
    </div>
  );
}
