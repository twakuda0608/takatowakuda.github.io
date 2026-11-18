const fs = require('fs');
const lines = fs.readFileSync('jr-map/data/build-data.js', 'utf8').split('\n');
const idx = lines.findIndex(l => l.includes('"st-i38p": {'));
console.log('st-i38p line:', idx + 1);
if (idx >= 0) {
  console.log(lines.slice(idx, idx + 45).join('\n'));
}
