const fs = require('fs');
const path = require('path');

function toUuid(id) {
  if (!id || typeof id !== 'string') return null;
  const clean = id.trim().replace(/^"|"$/g, '');
  if (!clean || clean.startsWith('service_')) return null;
  if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(clean)) {
    return clean;
  }
  if (/^[0-9a-fA-F]{24}$/.test(clean)) {
    const hex = clean.padStart(32, '0');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
  }
  return clean;
}

function jsonToPgArray(val) {
  if (!val) return '{}';
  const clean = String(val).trim().replace(/^"|"$/g, '');
  if (clean.startsWith('[') && clean.endsWith(']')) {
    try {
      const arr = JSON.parse(clean);
      if (Array.isArray(arr)) {
        if (arr.length === 0) return '{}';
        return '{' + arr.map((i) => '"' + String(i).replace(/"/g, '\\"') + '"').join(',') + '}';
      }
    } catch (e) {}
  }
  return val;
}

const ARRAY_COLUMNS = [
  'data_sources', 'protective_factors', 'limiting_factors', 'references',
  'supporting_actions', 'measuring', 'safety_flags', 'steps', 'expected_benefits',
  'confounders', 'interactions'
];

function processCsvContent(csvContent) {
  const lines = csvContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return '';

  const headerRaw = lines[0];
  const headers = headerRaw.split(',').map((h) => h.trim().replace(/^"|"$/g, ''));

  const mappedHeaders = [];
  const keepIndexes = [];

  headers.forEach((h, idx) => {
    if (h === 'is_sample') return;
    keepIndexes.push(idx);
    if (h === 'created_date') mappedHeaders.push('created_at');
    else if (h === 'updated_date') mappedHeaders.push('updated_at');
    else mappedHeaders.push(h);
  });

  const outputLines = [mappedHeaders.map((h) => `"${h}"`).join(',')];

  for (let i = 1; i < lines.length; i++) {
    const rowRaw = lines[i];
    const cells = [];
    let currentCell = '';
    let inQuotes = false;

    for (let c = 0; c < rowRaw.length; c++) {
      const char = rowRaw[c];
      if (char === '"') {
        inQuotes = !inQuotes;
        currentCell += char;
      } else if (char === ',' && !inQuotes) {
        cells.push(currentCell.trim());
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
    cells.push(currentCell.trim());

    const newCells = [];
    keepIndexes.forEach((idx) => {
      let cell = cells[idx] || '""';
      const colName = headers[idx];

      // Convert IDs to valid UUID format
      if (['id', 'user_id', 'created_by_id', 'admin_id', 'protocol_id'].includes(colName)) {
        const rawVal = cell.replace(/^"|"$/g, '');
        const uuidVal = toUuid(rawVal);
        cell = uuidVal ? `"${uuidVal}"` : '""';
      }

      // Convert JSON array strings to Postgres array literal {} format
      if (ARRAY_COLUMNS.includes(colName)) {
        const rawVal = cell.replace(/^"|"$/g, '');
        if (rawVal.startsWith('[') && rawVal.endsWith(']')) {
          const pgArr = jsonToPgArray(rawVal);
          cell = `"${pgArr}"`;
        }
      }

      newCells.push(cell);
    });

    outputLines.push(newCells.join(','));
  }

  return outputLines.join('\n');
}

function processDirectory(inputDir, outputDir) {
  if (!fs.existsSync(inputDir)) return;
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const files = fs.readdirSync(inputDir).filter((f) => f.endsWith('.csv'));
  files.forEach((file) => {
    const inputPath = path.join(inputDir, file);
    const outputPath = path.join(outputDir, file.replace('.csv', '_supabase_ready.csv'));
    const content = fs.readFileSync(inputPath, 'utf8');
    const processed = processCsvContent(content);
    fs.writeFileSync(outputPath, processed, 'utf8');
    console.log(`Converted: ${file} -> ${path.basename(outputPath)}`);
  });
}

const inputFolder = process.argv[2] || 'C:/Users/danis/.gemini/antigravity-ide/brain/131450f9-5807-422c-8b5c-e16cac541437/.user_uploaded';
const outputFolder = path.join(__dirname, '../supabase_ready_imports');

processDirectory(inputFolder, outputFolder);

module.exports = { processCsvContent, toUuid, jsonToPgArray };
