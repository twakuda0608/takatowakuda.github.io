const fs = require('fs');
const code = fs.readFileSync('./jr-map/data/build-data.js', 'utf8');
const target = '"tohoku-main"';
const idx = code.indexOf(target);
const nextLine = code.indexOf('{\n    "id":', idx);
console.log(code.substring(nextLine - 300, nextLine));
