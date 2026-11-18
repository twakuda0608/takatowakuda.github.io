const fs = require('fs');
globalThis.window = globalThis;
eval(fs.readFileSync('jr-map/data/build-data.js', 'utf8'));
eval(fs.readFileSync('jr-map/data/tracks.js', 'utf8'));
const RouteEngine = require('../jr-map/route-engine.js');
const STATIONS = window.JR_STATIONS;

function findId(name) {
  for (const id in STATIONS) {
    if (STATIONS[id].name === name) return id;
  }
}

const graph = RouteEngine.buildGraph(window.JR_STATIONS, window.JR_LINES);

const res = RouteEngine.searchMarsRoute(
  graph,
  window.JR_TRACKS,
  window.JR_STATIONS,
  [findId('東京'), findId('米原'), findId('京都')],
  { useShinkansen: false, searchMode: 'shortest' }
);

console.log('Mars:', res.marsString);
console.log('TotalKm:', res.totalKm);
console.log('isOneWayTrip:', res.isOneWayTrip);
console.log('normalPolylines count:', res.normalPolylines.length);
console.log('duplicatePolylines count:', res.duplicatePolylines.length);
console.log('duplicateStationIds:', res.duplicateStationIds);
res.sections.forEach((s, idx) => {
  console.log(`Sec ${idx+1}: ${s.lineName} (${s.deptName} -> ${s.destName}) dup: ${s.isDuplicate}`);
});
