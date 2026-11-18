const fs = require('fs');
const content = fs.readFileSync('jr-map/data/build-data.js', 'utf8');
const pos = content.indexOf('"id": "sanin-main"');
const endPos = content.indexOf('},', pos + 2000);
console.log(content.slice(endPos - 60, endPos + 60));
