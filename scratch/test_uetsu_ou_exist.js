const fs = require('fs');
const dataCode = fs.readFileSync('jr-map/data/build-data.js', 'utf8');
const window = {};
eval(dataCode);

const stations = window.JR_STATIONS;

// Uetsu
const uetsu = window.JR_LINES.find(l => l.id === 'uetsu-niigata');
const uetsuStations = [...uetsu.stations].reverse();
let uAll = uetsuStations.every(id => !!stations[id]);
console.log(`Uetsu: ${uetsuStations.length} stations, all exist: ${uAll}, start: ${stations[uetsuStations[0]].name}, end: ${stations[uetsuStations[uetsuStations.length-1]].name}`);

// Ou
const ou = window.JR_LINES.find(l => l.id === 'ou-main-south');
const ouStations = [...ou.stations].reverse();
let oAll = ouStations.every(id => !!stations[id]);
console.log(`Ou: ${ouStations.length} stations, all exist: ${oAll}, start: ${stations[ouStations[0]].name}, end: ${stations[ouStations[ouStations.length-1]].name}`);
