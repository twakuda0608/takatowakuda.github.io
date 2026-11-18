const fs = require('fs');
const code = fs.readFileSync('./jr-map/data/build-data.js', 'utf8');
const target = '"yamanote"';
const idx = code.indexOf(target);
console.log(code.substring(idx - 20, idx + 200));
