const fs = require('fs');
const content = fs.readFileSync('jr-map/data/official-kilos.js', 'utf8');

function inspectBlock(name) {
  const target = `"${name}": {`;
  const pos = content.indexOf(target);
  if (pos !== -1) {
    const end = content.indexOf('},', pos);
    console.log(`=== ${name} ===`);
    console.log(content.slice(pos, end + 2));
  }
}

inspectBlock('tokaido-west');
inspectBlock('sanyo-main');
inspectBlock('sanin-main');
