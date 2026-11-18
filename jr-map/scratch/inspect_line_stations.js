const fs = require('fs');
const content = fs.readFileSync('jr-map/data/build-data.js', 'utf8');

function showLineStations(id) {
  const p = content.indexOf(`"id": "${id}"`);
  const end = content.indexOf('],', p);
  console.log(`=== ${id} ===`);
  console.log(content.slice(p, end + 2));
}

showLineStations('kyushu-kyudai');
showLineStations('kyushu-nichinan');
showLineStations('hokkaido-chitose');
showLineStations('hokkaido-muroran');
showLineStations('hokkaido-hakodate');
