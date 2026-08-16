const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Read .env file for Supabase credentials
const envPath = path.join(__dirname, '../.env');
if (!fs.existsSync(envPath)) {
  console.error('.env file not found');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = Object.fromEntries(
  envContent.split(/\r?\n/).filter((l) => l.includes('=')).map((l) => {
    const idx = l.indexOf('=');
    return [l.substring(0, idx).trim(), l.substring(idx + 1).trim()];
  })
);

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function parseCsv(csvString) {
  const lines = csvString.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const rowRaw = lines[i];
    const cells = [];
    let currentCell = '';
    let inQuotes = false;

    for (let c = 0; c < rowRaw.length; c++) {
      const char = rowRaw[c];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        cells.push(currentCell.trim());
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
    cells.push(currentCell.trim());

    const record = {};
    headers.forEach((h, idx) => {
      let val = cells[idx];
      if (val === undefined || val === null || val === '""' || val === '') {
        val = null;
      } else {
        // Try parsing JSON strings for jsonb columns
        if ((val.startsWith('{') && val.endsWith('}')) || (val.startsWith('[') && val.endsWith(']'))) {
          try {
            val = JSON.parse(val);
          } catch {
            // keep string if not valid JSON
          }
        }
      }
      record[h] = val;
    });

    records.push(record);
  }

  return records;
}

// Table mapping for ready imports
const FILE_TO_TABLE = {
  'media_1786915002142_supabase_ready.csv': 'admin_otps',
  'media_1786915002147_supabase_ready.csv': 'brain_domains',
  'media_1786915002151_supabase_ready.csv': 'clinical_flags',
  'media_1786915002172_supabase_ready.csv': 'assessments',
};

async function seedData() {
  const importsDir = path.join(__dirname, '../supabase_ready_imports');
  if (!fs.existsSync(importsDir)) {
    console.log('No supabase_ready_imports folder found.');
    return;
  }

  const files = fs.readdirSync(importsDir).filter((f) => f.endsWith('.csv'));

  for (const file of files) {
    const tableName = FILE_TO_TABLE[file];
    if (!tableName) {
      console.log(`Skipping unknown file mapping: ${file}`);
      continue;
    }

    const filePath = path.join(importsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const records = parseCsv(content);

    console.log(`Uploading ${records.length} records to table "${tableName}"...`);
    const { data, error } = await supabase.from(tableName).upsert(records);

    if (error) {
      console.error(`Error uploading to ${tableName}:`, error.message);
    } else {
      console.log(`Successfully uploaded ${records.length} records to "${tableName}"!`);
    }
  }
}

seedData().catch(console.error);
