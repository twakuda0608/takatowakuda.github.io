const fs = require('fs');
const content = fs.readFileSync('jr-map/data/build-data.js', 'utf8');

const p = content.indexOf('"id": "hokkaido-muroran"');
const end = content.indexOf('},', p);
console.log(content.slice(end - 80, end + 80));
