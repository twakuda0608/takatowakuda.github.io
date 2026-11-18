const fs = require('fs');
const content = fs.readFileSync('jr-map/data/build-data.js', 'utf8');
const pos = content.indexOf('"id": "sanyo-main"');
const endPos = content.indexOf('},', pos + 2000);
console.log(content.slice(endPos - 100, endPos + 100));
