const fs = require('fs');
const code = fs.readFileSync('./jr-map/data/build-data.js', 'utf8');
const target = '"id": "kyushu-kagoshima"';
const idx = code.indexOf(target);
const nextLine = code.indexOf('{\n    "id":', idx);
console.log(code.substring(idx - 10, idx + 400));
console.log('--- end ---');
console.log(code.substring(nextLine - 300, nextLine));
