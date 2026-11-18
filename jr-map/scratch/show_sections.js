const fs = require('fs');
const content = fs.readFileSync('jr-map/data/build-data.js', 'utf8');

function showSection(id) {
  const target = `"id": "${id}"`;
  const pos = content.indexOf(target);
  if (pos !== -1) {
    console.log(`=== ${id} ===`);
    console.log(content.slice(pos, pos + 800));
  }
}

showSection('osaka-loop');
showSection('sanyo-main');
showSection('sanin-main');
