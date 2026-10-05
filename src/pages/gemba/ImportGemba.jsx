import ExcelImporter from "../../components/import/ExcelImporter";
import { serverTimestamp } from "firebase/database";
import { GEMBA_HEADERS, HEADER_ROW_INDEX, normalizeGembaRow } from "../../utils/schemaGemba";
import { sanitizeObject } from "../../utils/firebaseSanitize";
import { importWithDedupe, sigGemba } from "../../utils/dedupe";

const EXPECTED_COLUMNS = GEMBA_HEADERS.map((c) => ({
  key: c,
  required: ["Date", "Auditeur", "Question"].includes(c),
}));

async function importGembaRows(rows) {
  return importWithDedupe({
    rows,
    path: "gemba_ojt",
    sigFn: sigGemba,
    transformFn: (row, sig) => {
      const normalized = normalizeGembaRow(row);
      const safeRaw = sanitizeObject(row);
      return {
        ...normalized,
        _raw: safeRaw,
        _sig: sig,
        _importedAt: serverTimestamp(),
      };
    },
  });
}

export default function ImportGemba() {
  return (
    <ExcelImporter
      title="Import Gemba OJT Data"
      description="Upload 'Gemba app.xlsx'. Duplicates are skipped automatically (same Date + UAP + Ligne + Auditeur + Point M + Question = same audit line)."
      columns={EXPECTED_COLUMNS}
      templateName="gemba-ojt-template.xlsx"
      onImport={async (rows) => {
        const r = await importGembaRows(rows);
        return `Import terminé : ${r.inserted} ajoutés, ${r.skipped} déjà existants (sur ${r.total}).`;
      }}
      headerRowIndex={HEADER_ROW_INDEX}
    />
  );
}
