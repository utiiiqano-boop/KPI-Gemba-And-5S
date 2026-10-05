import { useMemo, useState } from "react";
import "./ResultsTable.css";

export default function ResultsTable({
  columns,
  rows,
  initialSort,
  pageSize = 25,
  emptyMessage = "Aucune donnée.",
}) {
  const [sort, setSort] = useState(initialSort || null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((r) =>
      columns.some((c) => {
        const v = c.sortValue ? c.sortValue(r) : r[c.key];
        return String(v ?? "").toLowerCase().includes(q);
      })
    );
  }, [rows, search, columns]);

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return filtered;
    const getVal = col.sortValue ? col.sortValue : (r) => r[col.key];
    return [...filtered].sort((a, b) => {
      const va = getVal(a);
      const vb = getVal(b);
      if (va === vb) return 0;
      const cmp = va > vb ? 1 : -1;
      return sort.dir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sort, columns]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  function toggleSort(key) {
    setSort((s) => {
      if (!s || s.key !== key) return { key, dir: "asc" };
      if (s.dir === "asc") return { key, dir: "desc" };
      return null;
    });
    setPage(1);
  }

  function exportCSV() {
    const headers = columns.map((c) => c.label);
    const lines = [headers.join(",")];
    sorted.forEach((r) => {
      const cells = columns.map((c) => {
        const v = c.sortValue ? c.sortValue(r) : r[c.key];
        const s = String(v ?? "").replace(/"/g, '""');
        return `"${s}"`;
      });
      lines.push(cells.join(","));
    });
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="rt-wrap">
      <div className="rt-toolbar">
        <input
          className="rt-search"
          placeholder="Rechercher…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        <div className="rt-toolbar-right">
          <span className="rt-count">
            {sorted.length} ligne{sorted.length > 1 ? "s" : ""}
          </span>
          <button className="rt-export" onClick={exportCSV} type="button">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" strokeLinecap="round"/>
              <path d="M7 10l5 5 5-5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 15V3" strokeLinecap="round"/>
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      <div className="rt-scroll">
        <table className="rt-table">
          <thead>
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  style={{ width: c.width, textAlign: c.align || "left" }}
                  onClick={() => toggleSort(c.key)}
                  className="rt-sortable"
                >
                  {c.label}
                  {sort?.key === c.key && (
                    <span className="rt-arrow">{sort.dir === "asc" ? " ▲" : " ▼"}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="rt-empty">{emptyMessage}</td>
              </tr>
            ) : (
              pageRows.map((r, i) => (
                <tr key={i}>
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      style={{ textAlign: c.align || "left" }}
                      className={c.wrap ? "wrap" : ""}
                    >
                      {c.render ? c.render(r) : (r[c.key] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="rt-pager">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1} type="button">‹ Préc</button>
          <span>Page {safePage} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} type="button">Suiv ›</button>
        </div>
      )}
    </div>
  );
}
