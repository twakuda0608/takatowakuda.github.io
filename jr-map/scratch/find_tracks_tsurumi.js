const fs = require('fs');
const lines = fs.readFileSync('jr-map/data/tracks.js', 'utf8').split('\n');
const idx = lines.findIndex(l => l.includes('"tsurumi-line":'));
console.log('tsurumi-line in tracks line:', idx + 1);
if (idx >= 0) {
  console.log(lines.slice(idx, idx + 5).join('\n'));
}
