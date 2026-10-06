import ExcelImporter from "../../components/import/ExcelImporter";
import { serverTimestamp } from "firebase/database";
import { GEMBA_HEADERS, HEADER_ROW_INDEX, normalizeGembaRow } from "../../utils/schemaGemba";
import { sanitizeObject } from "../../utils/firebaseSanitize";
import { importWithDedupe, sigGemba } from "../../utils/dedupe";

const EXPECTED_COLUMNS = GEMBA_HEADERS.map((c) => ({
  key: c,
  required: ["Date", "Auditeur", "Question"].includes(c),
}));

async function importGembaRows(rows, parsed) {
  // On IGNORE parsed.headers (SheetJS peut renommer les doublons).
  // On force le mapping qu'on connaît.
  const headers = GEMBA_HEADERS;

  return importWithDedupe({
    rows,
    path: "gemba_ojt",
    sigFn: (row) => sigGemba(row, headers),
    transformFn: (row, sig) => {
      const normalized = normalizeGembaRow(row, headers);
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
      description="Upload 'Gemba app.xlsx'. Colonnes lues par position."
      columns={EXPECTED_COLUMNS}
      templateName="gemba-ojt-template.xlsx"
      onImport={async (rows, parsed) => {
        const r = await importGembaRows(rows, parsed);
        return `Import terminé : ${r.inserted} ajoutés, ${r.skipped} déjà existants (sur ${r.total}).`;
      }}
      headerRowIndex="auto"
    />
  );
}