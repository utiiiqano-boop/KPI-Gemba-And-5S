import { useMemo, useState } from "react";
import { useRealtimeList } from "../../hooks/useFirebaseData";
import { parseDate, groupGembaAudits } from "../../utils/analytics";
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
  const [viewMode, setViewMode] = useState("audits");

  const lignes = useMemo(() => [...new Set(records.map((r) => r.ligne).filter(Boolean))].sort(), [records]);
  const uaps = useMemo(() => [...new Set(records.map((r) => r.uap).filter(Boolean))].sort(), [records]);
  const auditeurs = useMemo(() => [...new Set(records.map((r) => r.auditeur).filter(Boolean))].sort(), [records]);

  const filtered = useMemo(() => {
    return records.filter((r) => {
      const d = parseDate(r.date);
      if (ligne && r.ligne !== ligne) return false;
      if (uap && r.uap !== uap) return false;
      if (auditeur && r.auditeur !== auditeur) return false;
      if (from) { if (!d || d < new Date(from)) return false; }
      if (to) { if (!d || d > new Date(to)) return false; }
      return true;
    });
  }, [records, ligne, uap, auditeur, from, to]);

  const auditRows = useMemo(() => {
    const audits = groupGembaAudits(filtered);
    return audits.map((a) => {
      const ok = a.questions.filter((q) => String(q.reponse).toUpperCase() === "OK").length;
      const nok = a.questions.filter((q) => String(q.reponse).toUpperCase() === "NOK").length;
      const na = a.questions.filter((q) => String(q.reponse).toUpperCase() === "N/A").length;
      const d = parseDate(a.date);
      return {
        _id: a.key,
        dateLabel: d ? d.toLocaleDateString("fr-FR") : (a.date || "—"),
        dateTs: d ? d.getTime() : 0,
        uap: a.uap || "—",
        ligne: a.ligne || "—",
        questions: a.questions.length,
        ok, nok, na,
        score: a.score,
      };
    }).sort((a, b) => b.dateTs - a.dateTs);
  }, [filtered]);

  const questionRows = useMemo(() => {
    return filtered.map((r, i) => {
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
    }).sort((a, b) => b.dateTs - a.dateTs);
  }, [filtered]);

  const reset = () => { setLigne(""); setUap(""); setAuditeur(""); setFrom(""); setTo(""); };
  const hasFilter = ligne || uap || auditeur || from || to;

  const repPill = (v) => {
    const s = String(v).toUpperCase();
    const cls = s === "OK" ? "pill-OK" : s === "NOK" ? "pill-NOK" : "pill-NA";
    return <span className={`pill ${cls}`}>{v}</span>;
  };

  const scoreCell = (r) => (
    <span style={{ color: r.score >= 90 ? "#86efac" : r.score >= 75 ? "#fde047" : "#fca5a5", fontWeight: 600 }}>
      {Number(r.score).toFixed(1)}
    </span>
  );

  const auditColumns = [
    { key: "dateLabel", label: "Date", sortValue: (r) => r.dateTs, width: 110 },
    { key: "uap", label: "UAP", width: 110 },
    { key: "ligne", label: "Ligne", width: 140 },
    { key: "questions", label: "Questions", align: "center", width: 90, sortValue: (r) => r.questions },
    { key: "ok", label: "OK", align: "center", width: 60, sortValue: (r) => r.ok,
      render: (r) => <span style={{ color: "#86efac", fontWeight: 600 }}>{r.ok}</span> },
    { key: "nok", label: "NOK", align: "center", width: 60, sortValue: (r) => r.nok,
      render: (r) => <span style={{ color: r.nok > 0 ? "#fca5a5" : "#64748b", fontWeight: 600 }}>{r.nok}</span> },
    { key: "na", label: "N/A", align: "center", width: 60, sortValue: (r) => r.na },
    { key: "score", label: "Score %", align: "center", width: 90, sortValue: (r) => r.score, render: scoreCell },
  ];

  const questionColumns = [
    { key: "dateLabel", label: "Date", sortValue: (r) => r.dateTs, width: 100 },
    { key: "uap", label: "UAP", width: 90 },
    { key: "ligne", label: "Ligne", width: 110 },
    { key: "auditeur", label: "Auditeur", width: 150 },
    { key: "pointM", label: "Point M", width: 140 },
    { key: "question", label: "Question", width: 240, wrap: true },
    { key: "reponse", label: "Réponse", align: "center", width: 90, render: (r) => repPill(r.reponse) },
    { key: "action", label: "Action corrective", width: 300, wrap: true,
      render: (r) => (r.action && r.action !== "-" && r.action !== "—") ? r.action : "—" },
    { key: "pilote", label: "Pilote", width: 110 },
    { key: "dateAction", label: "Échéance", width: 100 },
    { key: "score", label: "Score %", align: "center", width: 85, sortValue: (r) => r.score, render: scoreCell },
  ];

  const columns = viewMode === "audits" ? auditColumns : questionColumns;
  const rows = viewMode === "audits" ? auditRows : questionRows;

  return (
    <div className="results-page">
      <ResultFilters>
        <Select label="Ligne" value={ligne} onChange={setLigne} options={lignes} />
        <Select label="UAP" value={uap} onChange={setUap} options={uaps} />
        <Select label="Auditeur" value={auditeur} onChange={setAuditeur} options={auditeurs} />
        <DateRange from={from} to={to} onFrom={setFrom} onTo={setTo} />
        <button
          type="button"
          className="filter-reset"
          style={{ background: "rgba(99,102,241,0.15)", color: "#a5b4fc", borderColor: "rgba(99,102,241,0.4)" }}
          onClick={() => setViewMode(viewMode === "audits" ? "questions" : "audits")}
        >
          {viewMode === "audits" ? "Vue: Audits groupés" : "Vue: Questions (détail)"}
        </button>
        <ResetButton onClick={reset} disabled={!hasFilter} />
      </ResultFilters>

      <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>
        {viewMode === "audits"
          ? `${auditRows.length} audits (Date + UAP + Ligne)`
          : `${questionRows.length} lignes de questions`}
      </div>

      {loading ? (
        <div className="rt-wrap"><div className="rt-empty">Chargement…</div></div>
      ) : (
        <ResultsTable
          columns={columns}
          rows={rows}
          initialSort={{ key: "dateLabel", dir: "desc" }}
          pageSize={30}
          emptyMessage="Aucune donnée Gemba pour ces filtres."
        />
      )}
    </div>
  );
}
