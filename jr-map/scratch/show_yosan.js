const fs = require('fs');
const code = fs.readFileSync('./jr-map/data/official-kilos.js', 'utf8');
const idx = code.indexOf('"shikoku-yosan":');
const endIdx = code.indexOf('},', idx);
console.log(code.substring(idx, endIdx + 2));
