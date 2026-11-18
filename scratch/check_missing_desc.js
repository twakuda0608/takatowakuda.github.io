const fs = require('fs');
const dataCode = fs.readFileSync('jr-map/data/build-data.js', 'utf8');
const window = {};
eval(dataCode);

const lines = window.JR_LINES;
lines.forEach(l => {
  if (!l.description || !l.en) {
    console.log(`Line without en/desc: [${l.id}] ${l.name}`);
  }
});
