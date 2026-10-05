import ExcelImporter from "../../components/import/ExcelImporter";
import { serverTimestamp } from "firebase/database";
import {
  HEADER_ROW_INDEX,
  QUESTIONS_5S,
  normalize5SRow,
} from "../../utils/schema5S";
import { sanitizeObject } from "../../utils/firebaseSanitize";
import { importWithDedupe, sig5S } from "../../utils/dedupe";

const EXPECTED_COLUMNS = QUESTIONS_5S.map((q) => ({
  key: `Q${q.index} · ${q.pillar} · ${q.short}`,
  required: false,
}));

async function import5SRows(rows, parsed) {
  const headers = parsed.headers;

  const result = await importWithDedupe({
    rows,
    path: "5s_audits",
    sigFn: (row) => {
      const normalized = normalize5SRow(row, headers);
      // attach the signature so the transform can reuse it
      row.__normalized = normalized;
      return sig5S(row, normalized);
    },
    transformFn: (row, sig) => {
      const normalized = row.__normalized || normalize5SRow(row, headers);
      const safeRaw = sanitizeObject(row);
      delete safeRaw.__normalized;
      return {
        ...normalized,
        _raw: safeRaw,
        _sig: sig,
        _importedAt: serverTimestamp(),
      };
    },
  });

  return result;
}

export default function Import5S() {
  return (
    <ExcelImporter
      title="Import 5S Audit Data"
      description="Upload '5S APP.xlsx'. Duplicates are skipped automatically (same ID + Date + Zone + Auditeur = same audit). You can re-upload the same file safely."
      columns={EXPECTED_COLUMNS}
      templateName="5s-audit-template.xlsx"
      onImport={async (rows, parsed) => {
        const r = await import5SRows(rows, parsed);
        // show a friendly message with skipped count
        return `Import terminé : ${r.inserted} ajoutés, ${r.skipped} déjà existants (sur ${r.total}).`;
      }}
      headerRowIndex={HEADER_ROW_INDEX}
    />
  );
}
