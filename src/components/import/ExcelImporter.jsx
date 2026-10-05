import { useRef, useState } from "react";
import { readExcelFile } from "../../utils/excelParser";
import "./ExcelImporter.css";

export default function ExcelImporter({
  title,
  description,
  columns = [],
  onImport,
  templateName = "template.xlsx",
  headerRowIndex = 0,   // 👈 NEW: 0 = row 1 is header, 1 = row 2 is header
}) {
  const [dragging, setDragging] = useState(false);
  const [parsed, setParsed] = useState(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [importing, setImporting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [showColumns, setShowColumns] = useState(false);
  const inputRef = useRef(null);

  async function handleFile(file) {
    setError("");
    setSuccessMsg("");
    setParsed(null);
    if (!file) return;

    if (!/\.(xlsx|xls|csv)$/i.test(file.name)) {
      setError("Please upload an .xlsx, .xls or .csv file.");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setError("File is too large (max 15 MB).");
      return;
    }

    setFileName(file.name);
    try {
      const data = await readExcelFile(file, headerRowIndex);
      if (!data.rows.length) {
        setError(
          `The file has no data rows after the header (header row index ${headerRowIndex + 1}).`
        );
        return;
      }

      if (columns.length) {
        const headers = data.headers.map((h) => String(h).trim());
        const missing = columns
          .filter((c) => c.required)
          .map((c) => c.key)
          .filter((k) => !headers.includes(String(k).trim()));
        if (missing.length) {
          setError(`Missing required column(s): ${missing.map((m) => `"${m}"`).join(", ")}`);
          return;
        }
      }

      setParsed(data);
    } catch (err) {
      console.error(err);
      setError("Failed to read the file. Make sure it's a valid Excel file.");
    }
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  }

  function onInputChange(e) {
    handleFile(e.target.files?.[0]);
  }

  async function confirmImport() {
    if (!parsed) return;
    try {
      setImporting(true);
      setError("");
      await onImport(parsed.rows, parsed);
      setSuccessMsg(`✅ Imported ${parsed.rows.length} row(s) successfully!`);
      setTimeout(() => {
        setParsed(null);
        setFileName("");
      }, 1500);
    } catch (err) {
      console.error(err);
      setError("Import failed: " + (err.message || err));
    } finally {
      setImporting(false);
    }
  }

  function reset() {
    setParsed(null);
    setFileName("");
    setError("");
    setSuccessMsg("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="importer">
      <div className="importer-header">
        <div>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
      </div>

      {columns.length > 0 && (
        <div className="columns-info">
          <button
            type="button"
            className="columns-info-toggle"
            onClick={() => setShowColumns((v) => !v)}
          >
            <span className={`chevron ${showColumns ? "open" : ""}`}>▸</span>
            Expected columns ({columns.length})
            <span className="columns-info-hint">
              {columns.filter((c) => c.required).length} required
            </span>
          </button>
          {showColumns && (
            <div className="columns-chips">
              {columns.map((c) => (
                <span
                  key={c.key}
                  className={`chip ${c.required ? "chip-required" : ""}`}
                  title={c.key}
                >
                  {c.key.length > 40 ? c.key.slice(0, 40) + "…" : c.key}
                  {c.required && <span className="chip-star">*</span>}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {!parsed && (
        <div
          className={`dropzone ${dragging ? "dragging" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
        >
          <div className="dropzone-icon">
            <svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" strokeLinecap="round" />
              <path d="M17 8l-5-5-5 5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 3v12" strokeLinecap="round" />
            </svg>
          </div>
          <div className="dropzone-title">
            {dragging ? "Drop your file here" : "Drag & drop your Excel file"}
          </div>
          <div className="dropzone-sub">
            or <span className="browse">browse</span> from your computer
          </div>
          <div className="dropzone-hint">Supports .xlsx, .xls, .csv — max 15 MB</div>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={onInputChange}
            hidden
          />
        </div>
      )}

      {error && <div className="alert-error">{error}</div>}
      {successMsg && <div className="alert-success">{successMsg}</div>}

      {parsed && (
        <div className="preview">
          <div className="preview-header">
            <div>
              <strong>{fileName}</strong>
              <span className="preview-meta">
                {parsed.rows.length} rows · {parsed.headers.length} columns · sheet "{parsed.sheetName}"
              </span>
            </div>
            <button className="btn-ghost" onClick={reset} type="button">Cancel</button>
          </div>

          <div className="table-wrap">
            <table className="preview-table">
              <thead>
                <tr>
                  <th>#</th>
                  {parsed.headers.slice(0, 10).map((h) => (
                    <th key={h} title={h}>
                      {String(h).length > 22 ? String(h).slice(0, 22) + "…" : h}
                    </th>
                  ))}
                  {parsed.headers.length > 10 && <th>…+{parsed.headers.length - 10} more</th>}
                </tr>
              </thead>
              <tbody>
                {parsed.rows.slice(0, 8).map((row, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    {parsed.headers.slice(0, 10).map((h) => (
                      <td key={h}>{String(row[h] ?? "").slice(0, 30)}</td>
                    ))}
                    {parsed.headers.length > 10 && <td>…</td>}
                  </tr>
                ))}
              </tbody>
            </table>
            {parsed.rows.length > 8 && (
              <div className="preview-more">
                …and {parsed.rows.length - 8} more rows
              </div>
            )}
          </div>

          <div className="preview-actions">
            <button
              className="btn-primary"
              onClick={confirmImport}
              disabled={importing}
              type="button"
            >
              {importing ? (
                <>
                  <span className="spinner-sm" />
                  Importing...
                </>
              ) : (
                `Import ${parsed.rows.length} row(s)`
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
