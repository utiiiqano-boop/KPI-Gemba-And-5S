import ExcelImporter from "../../components/import/ExcelImporter";
import { database } from "../../firebase/config";
import { ref, push, serverTimestamp } from "firebase/database";
import { GEMBA_HEADERS, HEADER_ROW_INDEX, normalizeGembaRow } from "../../utils/schemaGemba";
import { sanitizeObject } from "../../utils/firebaseSanitize";

// Note: "UAP" is present twice in the file → SheetJS produces "UAP" and "UAP_1".
const EXPECTED_COLUMNS = GEMBA_HEADERS.map((c) => ({
  key: c,
  required: ["Date", "Auditeur", "Question"].includes(c),
}));

async function importGembaRows(rows) {
  const rootRef = ref(database, "gemba_ojt");
  const promises = rows.map((row) => {
    const normalized = normalizeGembaRow(row);
    const safeRaw = sanitizeObject(row);
    return push(rootRef, {
      ...normalized,
      _raw: safeRaw,
      _importedAt: serverTimestamp(),
    });
  });
  await Promise.all(promises);
}

export default function ImportGemba() {
  return (
    <ExcelImporter
      title="Import Gemba OJT Data"
      description="Upload 'Gemba app.xlsx'. Headers are on row 1. The duplicate 'UAP' column is automatically renamed 'UAP_1' by the parser and stored as 'uap2'."
      columns={EXPECTED_COLUMNS}
      templateName="gemba-ojt-template.xlsx"
      onImport={importGembaRows}
      headerRowIndex={HEADER_ROW_INDEX}
    />
  );
}
