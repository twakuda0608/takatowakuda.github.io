const fs = require('fs');
const content = fs.readFileSync('jr-map/data/build-data.js', 'utf8');
const pos = content.indexOf('"id": "shikoku-yosan"');
const endPos = content.indexOf('},', pos + 1000);
console.log(content.slice(endPos - 60, endPos + 60));
