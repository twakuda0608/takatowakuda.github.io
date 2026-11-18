const fs = require('fs');
const oldLines = fs.readFileSync('jr-map/data/official-kilos.js', 'utf8').split('\n');
const newLines = fs.readFileSync('C:/Users/Takato Wakuda/.gemini/antigravity-cli/brain/0fed1d73-5ea9-469b-b408-e44b39e3be6d/official-kilos-updated.js', 'utf8').split('\n');

const diffIdxs = [];
for (let i = 0; i < oldLines.length; i++) if (oldLines[i] !== newLines[i]) diffIdxs.push(i);

const runs = [];
let cur = [diffIdxs[0]];
for (let j = 1; j < diffIdxs.length; j++) {
  if (diffIdxs[j] === diffIdxs[j-1] + 1) cur.push(diffIdxs[j]);
  else { runs.push(cur); cur = [diffIdxs[j]]; }
}
runs.push(cur);

const batches = [];
for (let k = 0; k < runs.length; k++) {
  const r = runs[k];
  const start = r[0];
  const end = r[r.length - 1];
  const len = oldLines.slice(start, end + 1).join('\n').length;
  if (len > 4000 && r.length > 1) {
    for (const lineIdx of r) batches.push({ start: lineIdx, end: lineIdx });
  } else {
    batches.push({ start, end });
  }
}

const s = parseInt(process.argv[2], 10);
const e = parseInt(process.argv[3], 10);

for (let i = s; i <= e; i++) {
  const b = batches[i - 1];
  const target = oldLines.slice(b.start, b.end + 1).join('\n');
  const repl = newLines.slice(b.start, b.end + 1).join('\n');
  console.log(`<<<BATCH ${i}>>>`);
  console.log('[[[TARGET]]]');
  console.log(target);
  console.log('[[[REPLACEMENT]]]');
  console.log(repl);
  console.log(`<<<END ${i}>>>`);
}
