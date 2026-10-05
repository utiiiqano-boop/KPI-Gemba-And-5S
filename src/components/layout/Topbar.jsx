import { useLocation } from "react-router-dom";
import "./Topbar.css";

const TITLES = {
  "/dashboard": { title: "Tableau de bord", sub: "Vue d'ensemble des KPIs 5S et Gemba" },
  "/5s/import": { title: "Importer les audits 5S", sub: "Charger le fichier Excel 5S" },
  "/5s/results": { title: "Résultats 5S", sub: "Graphiques et analyses" },
  "/5s/table": { title: "Tableau 5S", sub: "Vue détaillée des audits (filtres ligne / date)" },
  "/gemba/import": { title: "Importer les audits Gemba OJT", sub: "Charger le fichier Excel Gemba" },
  "/gemba/results": { title: "Résultats Gemba OJT", sub: "Graphiques et analyses" },
  "/gemba/table": { title: "Tableau Gemba OJT", sub: "Vue détaillée (filtres ligne / date)" },
};

export default function Topbar() {
  const { pathname } = useLocation();
  const meta = TITLES[pathname] || { title: "Tableau de bord", sub: "" };
  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1>{meta.title}</h1>
        {meta.sub && <p>{meta.sub}</p>}
      </div>
      <div className="topbar-right">
        <span className="topbar-date">{today}</span>
      </div>
    </header>
  );
}
