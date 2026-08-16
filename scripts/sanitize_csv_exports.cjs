const fs = require('fs');
const path = require('path');

/**
 * Utility to process and sanitize Base44 exported CSV files for Supabase PostgreSQL import.
 * Usage: node scripts/sanitize_csv_exports.cjs [directory_path]
 */

function sanitizeCsv(inputFilePath, outputFilePath) {
  if (!fs.existsSync(inputFilePath)) {
    console.error(`Input file not found: ${inputFilePath}`);
    return;
  }

  const content = fs.readFileSync(inputFilePath, 'utf8');
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return;

  const cleanedLines = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    cleanedLines.push(line);
  }

  fs.writeFileSync(outputFilePath, cleanedLines.join('\n'), 'utf8');
  console.log(`Successfully processed: ${path.basename(inputFilePath)} -> ${path.basename(outputFilePath)} (${cleanedLines.length - 1} rows)`);
}

const customTargetDir = process.argv[2];
const uploadedDir = customTargetDir || 'C:/Users/danis/.gemini/antigravity-ide/brain/131450f9-5807-422c-8b5c-e16cac541437/.user_uploaded';
const outputDir = path.join(__dirname, '../sanitized_imports');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

if (fs.existsSync(uploadedDir)) {
  const files = fs.readdirSync(uploadedDir).filter((f) => f.endsWith('.csv'));
  files.forEach((file) => {
    const inputPath = path.join(uploadedDir, file);
    const outputPath = path.join(outputDir, file.replace('.csv', '_sanitized.csv'));
    sanitizeCsv(inputPath, outputPath);
  });
} else {
  console.log(`Target directory ${uploadedDir} not found.`);
}

module.exports = { sanitizeCsv };
