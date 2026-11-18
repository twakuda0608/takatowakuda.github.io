const fs = require('fs');
const content = fs.readFileSync('jr-map/data/build-data.js', 'utf8');
const pos = content.indexOf('"st-dx79"');
console.log(content.slice(pos - 100, pos + 100));
