const fs = require('fs');
const oldLines = fs.readFileSync('jr-map/data/official-kilos.js', 'utf8').split('\n');
const newLines = fs.readFileSync('C:/Users/Takato Wakuda/.gemini/antigravity-cli/brain/0fed1d73-5ea9-469b-b408-e44b39e3be6d/official-kilos-updated.js', 'utf8').split('\n');

const diffIdxs = [];
for (let i = 0; i < oldLines.length; i++) {
  if (oldLines[i] !== newLines[i]) diffIdxs.push(i);
}
console.log('diffIdxs:', diffIdxs);

for (const idx of diffIdxs) {
  const oldL = oldLines[idx];
  const lineKey = oldL.match(/"([^"]+)":/)?.[1] || idx;
  console.log(`Line ${idx} (${lineKey}): oldLen=${oldL.length}, newLen=${newLines[idx].length}`);
}
