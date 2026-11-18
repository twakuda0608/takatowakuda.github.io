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

console.log('--- TEST A: 東京 -> 米原 -> 京都 ---');
const resA = RouteEngine.searchMarsRoute(
  graph,
  window.JR_TRACKS,
  window.JR_STATIONS,
  [findId('東京'), findId('米原'), findId('京都')],
  { useShinkansen: false, searchMode: 'shortest' }
);
console.log('Mars:', resA.marsString);
console.log('TotalKm:', resA.totalKm);
console.log('isOneWayTrip (Should be TRUE):', resA.isOneWayTrip);
console.log('Sections:', resA.sections.map(s => `${s.lineName} (${s.deptName}->${s.destName})`).join(' | '));
console.log('Duplicate polylines count (Should be 0):', resA.duplicatePolylines.length);

console.log('\n--- TEST B: 東京 -> 京都 (直通) ---');
const resB = RouteEngine.searchMarsRoute(
  graph,
  window.JR_TRACKS,
  window.JR_STATIONS,
  [findId('東京'), findId('京都')],
  { useShinkansen: false, searchMode: 'shortest' }
);
console.log('Mars:', resB.marsString);
console.log('TotalKm:', resB.totalKm);
console.log('isOneWayTrip (Should be TRUE):', resB.isOneWayTrip);

console.log('\n--- TEST C: 東京 -> 美濃赤坂 -> 京都 (実際の重複区間ありケース) ---');
const resC = RouteEngine.searchMarsRoute(
  graph,
  window.JR_TRACKS,
  window.JR_STATIONS,
  [findId('東京'), findId('美濃赤坂'), findId('京都')],
  { useShinkansen: false, searchMode: 'shortest' }
);
console.log('Mars:', resC.marsString);
console.log('TotalKm:', resC.totalKm);
console.log('isOneWayTrip (Should be FALSE):', resC.isOneWayTrip);
console.log('Duplicate polylines count (Should be > 0):', resC.duplicatePolylines.length);
if (resC.duplicatePolylines.length > 0) {
  console.log('Duplicate points:', resC.duplicatePolylines[0].length);
  console.log('First dup pt:', resC.duplicatePolylines[0][0]);
}
console.log('Sections with isDuplicate:');
resC.sections.forEach(s => {
  console.log(`  - ${s.lineName} (${s.deptName} -> ${s.destName}) dup: ${s.isDuplicate}`);
});

console.log('\n--- TEST D: 東京 -> 新宿 -> 東京 (中央線往復の重複区間ありケース) ---');
const resD = RouteEngine.searchMarsRoute(
  graph,
  window.JR_TRACKS,
  window.JR_STATIONS,
  [findId('東京'), findId('新宿'), findId('東京')],
  { useShinkansen: false, searchMode: 'shortest' }
);
console.log('Mars:', resD.marsString);
console.log('isOneWayTrip (Should be FALSE):', resD.isOneWayTrip);
console.log('Duplicate polylines count:', resD.duplicatePolylines.length);
console.log('Duplicate station IDs count:', resD.duplicateStationIds.length);
