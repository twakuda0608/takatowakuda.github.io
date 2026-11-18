const fs = require('fs');
const oldLines = fs.readFileSync('jr-map/data/official-kilos.js', 'utf8').split('\n');
const newLines = fs.readFileSync('C:/Users/Takato Wakuda/.gemini/antigravity-cli/brain/0fed1d73-5ea9-469b-b408-e44b39e3be6d/official-kilos-updated2.js', 'utf8').split('\n');

const diffIndices = [79, 94, 97, 124, 155, 159, 175, 179, 180];
for (const idx of diffIndices) {
  const lineKeyMatch = oldLines[idx].match(/"([^"]+)":/);
  const key = lineKeyMatch ? lineKeyMatch[1] : 'unknown';
  console.log(`=== Line ${idx}: ${key} ===`);
  const oldObj = JSON.parse('{' + oldLines[idx].trim().replace(/,$/, '') + '}');
  const newObj = JSON.parse('{' + newLines[idx].trim().replace(/,$/, '') + '}');
  const changes = [];
  for (const k of Object.keys(newObj[key])) {
    if (oldObj[key][k] !== newObj[key][k]) {
      changes.push(`${k}: ${oldObj[key][k]} -> ${newObj[key][k]}`);
    }
  }
  console.log(changes.slice(0, 10).join(', '));
  if (changes.length > 10) console.log(`... total changes: ${changes.length}`);
}
