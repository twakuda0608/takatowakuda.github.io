const fs = require('fs');
const oldLines = fs.readFileSync('jr-map/data/official-kilos.js', 'utf8').split('\n');
const newLines = fs.readFileSync('C:/Users/Takato Wakuda/.gemini/antigravity-cli/brain/0fed1d73-5ea9-469b-b408-e44b39e3be6d/official-kilos-updated.js', 'utf8').split('\n');

const diffIdxs = [];
for (let i = 0; i < oldLines.length; i++) if (oldLines[i] !== newLines[i]) diffIdxs.push(i);

// Contiguous runs of diffs
const runs = [];
let cur = [diffIdxs[0]];
for (let j = 1; j < diffIdxs.length; j++) {
  if (diffIdxs[j] === diffIdxs[j-1] + 1) cur.push(diffIdxs[j]);
  else { runs.push(cur); cur = [diffIdxs[j]]; }
}
runs.push(cur);

// Now group runs into batches of size <= 4000 chars (target length)
// Each batch is a single contiguous slice of oldLines [startLine, endLine]
const batches = [];
let bStart = runs[0][0];
let bEnd = runs[0][runs[0].length - 1];

for (let k = 1; k < runs.length; k++) {
  const nextStart = runs[k][0];
  const nextEnd = runs[k][runs[k].length - 1];
  const combinedLen = oldLines.slice(bStart, nextEnd + 1).join('\n').length;
  // If combining keeps slice under 4000 chars and gap is <= 5 lines, combine
  if (combinedLen <= 4000 && (nextStart - bEnd) <= 4) {
    bEnd = nextEnd;
  } else {
    batches.push({ start: bStart, end: bEnd });
    bStart = nextStart;
    bEnd = nextEnd;
  }
}
batches.push({ start: bStart, end: bEnd });

console.log('Total batches:', batches.length);
batches.forEach((b, i) => {
  const target = oldLines.slice(b.start, b.end + 1).join('\n');
  const repl = newLines.slice(b.start, b.end + 1).join('\n');
  console.log(`Batch ${i + 1} (lines ${b.start + 1}-${b.end + 1}): target ${target.length} chars, repl ${repl.length} chars`);
});
