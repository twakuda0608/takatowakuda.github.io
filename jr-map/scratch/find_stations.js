const fs = require('fs');
const lines = fs.readFileSync('jr-map/data/build-data.js', 'utf8').split('\n');
lines.forEach((l, i) => {
  if (l.includes('"st-bx0g1"') || l.includes('"st-cz2ur"')) {
    console.log(i, l);
  }
});
