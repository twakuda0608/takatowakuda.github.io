const fs = require('fs');
const oldLines = fs.readFileSync('jr-map/data/official-kilos.js', 'utf8').split('\n');
const newLines = fs.readFileSync('C:/Users/Takato Wakuda/.gemini/antigravity-cli/brain/0fed1d73-5ea9-469b-b408-e44b39e3be6d/official-kilos-updated.js', 'utf8').split('\n');

const diffIdxs = [];
for (let i = 0; i < oldLines.length; i++) {
  if (oldLines[i] !== newLines[i]) {
    diffIdxs.push(i);
  }
}
console.log('Total diff lines:', diffIdxs.length);

// Group into contiguous or near-contiguous groups
const groups = [];
let currentGroup = [diffIdxs[0]];
for (let j = 1; j < diffIdxs.length; j++) {
  const prev = diffIdxs[j - 1];
  const curr = diffIdxs[j];
  if (curr - prev <= 5) {
    currentGroup.push(curr);
  } else {
    groups.push(currentGroup);
    currentGroup = [curr];
  }
}
groups.push(currentGroup);

console.log('Group count:', groups.length);
groups.forEach((g, idx) => {
  const start = g[0];
  const end = g[g.length - 1];
  console.log(`Group ${idx + 1}: lines ${start + 1} to ${end + 1} (${g.length} changed lines, range ${end - start + 1} lines)`);
});
