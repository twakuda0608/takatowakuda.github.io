const fs = require('fs');
const lines = fs.readFileSync('jr-map/data/build-data.js', 'utf8').split('\n');
const keys = ['st-kgo8c6', 'st-ecpab', 'st-fogm', 'st-fj0gp', 'st-hudb', 'st-fl6e', 'st-e3qsx1', 'st-go0tc'];
keys.forEach(k => {
  const idx = lines.findIndex(l => l.includes('"' + k + '": {'));
  console.log(`${k}: line ${idx + 1}`);
});
const start = lines.findIndex(l => l.includes('"st-kgo8c6": {'));
const end = lines.findIndex(l => l.includes('"st-go0tc": {'));
console.log('range:', start + 1, 'to', end + 15);
console.log(lines.slice(start, end + 12).join('\n'));
