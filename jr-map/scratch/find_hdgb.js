const fs = require('fs');
const lines = fs.readFileSync('jr-map/data/build-data.js', 'utf8').split('\n');
const idx = lines.findIndex(l => l.includes('"st-hdgb": {'));
console.log('st-hdgb line:', idx + 1);
if (idx >= 0) {
  console.log(lines.slice(idx - 1, idx + 15).join('\n'));
}
