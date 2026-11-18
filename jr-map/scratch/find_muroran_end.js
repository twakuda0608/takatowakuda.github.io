const fs = require('fs');
const content = fs.readFileSync('jr-map/data/build-data.js', 'utf8');

const p = content.indexOf('"id": "hokkaido-muroran"');
const end = content.indexOf('},', p + 1000);
console.log(content.slice(end - 60, end + 60));
