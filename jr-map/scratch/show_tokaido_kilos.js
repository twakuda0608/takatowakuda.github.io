const fs = require('fs');
const code = fs.readFileSync('./jr-map/data/official-kilos.js', 'utf8');
const idx = code.indexOf('"tokaido":');
console.log(code.substring(idx, idx + 300));
