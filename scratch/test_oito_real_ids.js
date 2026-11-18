const fs = require('fs');
const dataCode = fs.readFileSync('jr-map/data/build-data.js', 'utf8');
const window = {};
eval(dataCode);

const stations = window.JR_STATIONS;
const lines = window.JR_LINES;

const l1 = lines.find(l => l.id === 'oito-line');
const l2 = lines.find(l => l.id === 'oito-west');

console.log('oito-west:');
l2.stations.forEach(id => console.log(`  ${id}: ${stations[id]?.name}`));

console.log('oito-line:');
l1.stations.forEach(id => console.log(`  ${id}: ${stations[id]?.name}`));
