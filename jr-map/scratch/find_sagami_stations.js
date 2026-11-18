const fs = require('fs');
const lines = fs.readFileSync('jr-map/data/build-data.js', 'utf8').split('\n');
const idx1 = lines.findIndex(l => l.includes('"st-km4m": {'));
console.log('st-km4m line:', idx1 + 1);
const idx2 = lines.findIndex(l => l.includes('"atsugi": {'));
console.log('atsugi line:', idx2 + 1);
if (idx1 >= 0 && idx2 >= 0) {
  console.log(lines.slice(idx1, idx2 + 15).join('\n'));
}
