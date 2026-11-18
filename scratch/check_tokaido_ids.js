const fs = require('fs');
globalThis.window = globalThis;
eval(fs.readFileSync('jr-map/data/build-data.js', 'utf8'));
const STATIONS = window.JR_STATIONS;
const LINES = window.JR_LINES;

const tokaidoLines = LINES.filter(l => l.name === '東海道本線');
console.log('Tokaido lines count:', tokaidoLines.length);

const allTokaidoStationIds = [];
tokaidoLines.forEach(l => {
  l.stations.forEach(id => {
    if (!allTokaidoStationIds.includes(id)) allTokaidoStationIds.push(id);
  });
});
console.log('Total unique stations in Tokaido lines:', allTokaidoStationIds.length);

// 駅名とIDの確認
const names = allTokaidoStationIds.map(id => ({ id, name: STATIONS[id]?.name }));
console.log('Sample names:');
console.log(names.slice(0, 10));
console.log(names.slice(-10));
