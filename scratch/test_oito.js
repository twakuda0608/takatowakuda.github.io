const fs = require('fs');
const trackCode = fs.readFileSync('jr-map/data/tracks.js', 'utf8');
const dataCode = fs.readFileSync('jr-map/data/build-data.js', 'utf8');
const window = {};
eval(dataCode);
eval(trackCode);

const lLine = window.JR_LINES.find(l => l.id === 'oito-line');
const lWest = window.JR_LINES.find(l => l.id === 'oito-west');
const tLine = window.JR_TRACKS['oito-line'][0];
const tWest = window.JR_TRACKS['oito-west'][0];

console.log('oito-line: stations =', lLine.stations.length, 'track pts =', tLine.length, 'start =', tLine[0], 'end =', tLine[tLine.length - 1]);
console.log('oito-west: stations =', lWest.stations.length, 'track pts =', tWest.length, 'start =', tWest[0], 'end =', tWest[tWest.length - 1]);
console.log('Stations in oito-line:', lLine.stations.map(id => window.JR_STATIONS[id]?.name));
console.log('Stations in oito-west:', lWest.stations.map(id => window.JR_STATIONS[id]?.name));
