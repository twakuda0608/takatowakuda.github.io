const fs = require('fs');
globalThis.window = globalThis;
eval(fs.readFileSync('jr-map/data/build-data.js', 'utf8'));
const STATIONS = window.JR_STATIONS;
const LINES = window.JR_LINES;

const lEast = LINES.find(l => l.id === 'tokaido');
const lTokai = LINES.find(l => l.id === 'tokai-tokaido');
const lWest = LINES.find(l => l.id === 'tokaido-west');

console.log('East stations count:', lEast.stations.length);
console.log('East names:', lEast.stations.map(id => STATIONS[id]?.name).join(', '));
console.log('\nTokai stations count:', lTokai.stations.length);
console.log('Tokai names:', lTokai.stations.map(id => STATIONS[id]?.name).join(', '));
console.log('\nWest stations count:', lWest.stations.length);
console.log('West names:', lWest.stations.map(id => STATIONS[id]?.name).join(', '));
