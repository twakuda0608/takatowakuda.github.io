const fs = require('fs');
const content = fs.readFileSync('jr-map/data/build-data.js', 'utf8');

const p = content.indexOf('"id": "hokkaido-hakodate"');
const end = content.indexOf('],', p);
const block = content.slice(p, end);
const moriPos = block.indexOf('"st-kq6"');
console.log(block.slice(moriPos - 30, moriPos + 400));
