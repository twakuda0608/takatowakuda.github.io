const fs = require('fs');
const content = fs.readFileSync('jr-map/data/build-data.js', 'utf8');
const lines = content.split(/\r?\n/);
const start = lines.findIndex(l => l.includes('"id": "kyushu-nagasaki"'));
console.log('Line numbers:', start + 1, 'to', start + 50);
console.log(lines.slice(start - 1, start + 48).join('\n'));
