const fs = require('fs');

const dataCode = fs.readFileSync('jr-map/data/build-data.js', 'utf8');
const window = {};
eval(dataCode);

const LINES = window.JR_LINES;
const STATIONS = window.JR_STATIONS;

console.log('Total App Lines:', LINES.length);

LINES.forEach((l, i) => {
  const s0 = STATIONS[l.stations[0]] ? STATIONS[l.stations[0]].name : l.stations[0];
  const sN = STATIONS[l.stations[l.stations.length - 1]] ? STATIONS[l.stations[l.stations.length - 1]].name : l.stations[l.stations.length - 1];
  console.log(`${i + 1}. [${l.id}] ${l.name}: ${s0} (${l.stations[0]}) 〜 ${sN} (${l.stations[l.stations.length - 1]}) [${l.stations.length} stations]`);
});
