import ExcelImporter from "../../components/import/ExcelImporter";
import { database } from "../../firebase/config";
import { ref, push, serverTimestamp } from "firebase/database";
import {
  HEADER_ROW_INDEX,
  QUESTIONS_5S,
  normalize5SRow,
} from "../../utils/schema5S";
import { sanitizeObject } from "../../utils/firebaseSanitize";

// Compact column list — we only show the metadata + the 26 question labels
// in the collapsible panel; the file's real headers are positional.
const EXPECTED_COLUMNS = QUESTIONS_5S.map((q) => ({
  key: `Q${q.index} · ${q.pillar} · ${q.short}`,
  required: false,
}));

async function import5SRows(rows, parsed) {
  const rootRef = ref(database, "5s_audits");
  const headers = parsed.headers; // from readExcelFile

  const promises = rows.map((row) => {
    const normalized = normalize5SRow(row, headers);
    const safeRaw = sanitizeObject(row);
    return push(rootRef, {
      ...normalized,
      _raw: safeRaw,
      _importedAt: serverTimestamp(),
    });
  });
  await Promise.all(promises);
}

export default function Import5S() {
  return (
    <ExcelImporter
      title="Import 5S Audit Data"
      description="Upload '5S APP.xlsx'. Row 1 in that file is the column-letter garbage row — the real headers are on row 2, so the importer skips row 1 automatically. All 26 questions + their Points / Feedback / Action are parsed by position."
      columns={EXPECTED_COLUMNS}
      templateName="5s-audit-template.xlsx"
      onImport={import5SRows}
      headerRowIndex={HEADER_ROW_INDEX}
    />
  );
}
