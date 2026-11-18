const fs = require('fs');
const dataCode = fs.readFileSync('jr-map/data/build-data.js', 'utf8');
const trackCode = fs.readFileSync('jr-map/data/tracks.js', 'utf8');
const window = {};
eval(dataCode);
eval(trackCode);

const lines = window.JR_LINES;
const tracks = window.JR_TRACKS;
const stations = window.JR_STATIONS;

console.log('--- Tohoku Main Lines ---');
['utsunomiya-line', 'tohoku-main-sendai', 'tohoku-main-morioka'].forEach(id => {
  const l = lines.find(x => x.id === id);
  console.log(`[${id}] stations: ${l.stations.length}, first 3: ${l.stations.slice(0, 3)}, last 3: ${l.stations.slice(-3)}`);
});

console.log('\n--- Uetsu Main Lines ---');
['uetsu-niigata', 'uetsu-north'].forEach(id => {
  const l = lines.find(x => x.id === id);
  console.log(`[${id}] stations: ${l.stations.length}, first 3: ${l.stations.slice(0, 3)}, last 3: ${l.stations.slice(-3)}`);
});

console.log('\n--- Ou Main Lines ---');
['ou-main-south', 'ou-main-north'].forEach(id => {
  const l = lines.find(x => x.id === id);
  console.log(`[${id}] stations: ${l.stations.length}, first 3: ${l.stations.slice(0, 3)}, last 3: ${l.stations.slice(-3)}`);
});

console.log('\n--- Oito Lines ---');
['oito-line', 'oito-west'].forEach(id => {
  const l = lines.find(x => x.id === id);
  console.log(`[${id}] stations: ${l.stations.length}, first 3: ${l.stations.slice(0, 3)}, last 3: ${l.stations.slice(-3)}`);
});
