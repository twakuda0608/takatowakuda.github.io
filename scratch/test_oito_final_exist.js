const fs = require('fs');
const dataCode = fs.readFileSync('jr-map/data/build-data.js', 'utf8');
const window = {};
eval(dataCode);

const stations = window.JR_STATIONS;
const lines = window.JR_LINES;

const l1 = lines.find(l => l.id === 'oito-line');
const l2 = lines.find(l => l.id === 'oito-west');

const oitoStations = [
  ...l2.stations, // 糸魚川 〜 南小谷
  ...l1.stations.slice(2) // 千国 〜 松本 (l1.stations[0] is itoigawa, [1] is minamiotari)
];

let oAll = oitoStations.every(id => !!stations[id]);
console.log(`Oito: ${oitoStations.length} stations, all exist: ${oAll}, start: ${stations[oitoStations[0]].name}, end: ${stations[oitoStations[oitoStations.length-1]].name}`);
