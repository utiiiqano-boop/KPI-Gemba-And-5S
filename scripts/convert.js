/**
 * Convert 5S.xlsx -> data/auditData.json
 * Usage: node scripts/convert.js
 */
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const INPUT  = path.join(__dirname, '..', '5S.xlsx');
const OUTPUT = path.join(__dirname, '..', 'data', 'auditData.json');

if (!fs.existsSync(INPUT)) {
  console.error('❌ 5S.xlsx not found at', INPUT);
  process.exit(1);
}

const wb = XLSX.readFile(INPUT);
const sheetName = wb.SheetNames[0];
const sheet = wb.Sheets[sheetName];

// Array-of-arrays mode (keeps exact row/column order)
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

// Find the real header row: the one containing "ID" AND "Nom"
let headerIdx = -1;
for (let i = 0; i < rows.length; i++) {
  const r = rows[i].map((c) => String(c ?? '').trim());
  if (r.includes('ID') && r.includes('Nom')) { headerIdx = i; break; }
}
if (headerIdx === -1) {
  console.error('❌ Could not find header row (needs "ID" and "Nom" columns)');
  process.exit(1);
}

const headers = rows[headerIdx].map((h) => String(h ?? '').trim());
console.log('📋 Headers detected:', headers.length, 'columns');
console.log('   First 5:', headers.slice(0, 5));

// Build clean objects for each data row
const data = [];
for (let i = headerIdx + 1; i < rows.length; i++) {
  const r = rows[i] || [];
  const obj = {};
  let hasValue = false;
  for (let j = 0; j < headers.length; j++) {
    const key = headers[j];
    if (!key) continue;
    const raw = r[j];
    const val = raw === undefined || raw === null ? '' : String(raw).trim();
    obj[key] = val;
    if (val) hasValue = true;
  }
  if (hasValue) data.push(obj);
}

// Write JSON
fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
fs.writeFileSync(OUTPUT, JSON.stringify(data, null, 2), 'utf8');

console.log(`✅ Wrote ${data.length} audit row(s) → ${OUTPUT}`);
