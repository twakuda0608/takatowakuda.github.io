const fs = require('fs');
const content = fs.readFileSync('jr-map/data/build-data.js', 'utf8');

const target = '"id": "banetsu-west"';
const pos = content.indexOf(target);
const end = content.indexOf('},', pos);
console.log(content.slice(pos, end + 2));
