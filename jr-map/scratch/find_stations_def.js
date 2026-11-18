const fs = require('fs');
const lines = fs.readFileSync('jr-map/data/build-data.js', 'utf8').split('\n');

lines.forEach((l, i) => {
  if (l.includes('const JR_STATIONS =') || l.includes('JR_STATIONS =')) {
    console.log(`JR_STATIONS: line ${i + 1}`);
  }
});
