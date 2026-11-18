const fs = require('fs');
const code = fs.readFileSync('./jr-map/data/build-data.js', 'utf8');
const target = '"id": "hokkaido-nemuro"';
const idx = code.indexOf(target);
const nextLine = code.indexOf('{\n    "id":', idx);
const block = code.substring(idx, nextLine);
const idxFurano = block.indexOf('"st-e311n"');
console.log('--- target block ---');
console.log(block.substring(idxFurano - 20, block.length));
