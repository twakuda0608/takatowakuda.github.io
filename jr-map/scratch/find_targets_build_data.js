const fs = require('fs');
const content = fs.readFileSync('jr-map/data/build-data.js', 'utf8');

function showAround(target, len = 300) {
  const p = content.indexOf(target);
  if (p !== -1) {
    console.log(`=== ${target} ===`);
    console.log(content.slice(p - 50, p + len));
  }
}

showAround('"id": "kyushu-kyudai"');
showAround('"id": "kyushu-nichinan"');
showAround('"id": "hokkaido-chitose"');
showAround('"id": "hokkaido-muroran"');
