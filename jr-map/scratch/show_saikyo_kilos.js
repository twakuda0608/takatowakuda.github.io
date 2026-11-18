const fs = require('fs');
const code = fs.readFileSync('./jr-map/data/official-kilos.js', 'utf8');
const idx = code.indexOf('"tohoku-main":');
const endIdx = code.indexOf('},', idx);
const block = code.substring(idx, endIdx + 2);
const idxToda = block.indexOf('"北戸田"');
console.log(block.substring(idxToda - 30, idxToda + 400));
