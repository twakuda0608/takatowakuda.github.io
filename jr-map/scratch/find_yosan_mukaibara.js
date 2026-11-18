const fs = require('fs');
const content = fs.readFileSync('jr-map/data/build-data.js', 'utf8');
const pos = content.indexOf('"st-cp3sr"'); // 向井原
console.log(content.slice(pos - 50, pos + 500));
