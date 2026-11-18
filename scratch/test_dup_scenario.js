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

// シナリオ1: 東京 -> 美濃赤坂 -> 京都
const res1 = RouteEngine.searchMarsRoute(graph, window.JR_TRACKS, window.JR_STATIONS, [findId('東京'), findId('美濃赤坂'), findId('京都')], { useShinkansen: false, searchMode: 'shortest' });
console.log('--- Scenario 1: Tokyo -> Mino-Akasaka -> Kyoto ---');
console.log('Success:', res1.success);
console.log('isOneWay:', res1.isOneWayTrip);
console.log('normalPolylines count:', res1.normalPolylines.length);
console.log('duplicatePolylines count:', res1.duplicatePolylines.length);
res1.sections.forEach(s => {
  console.log(`- ${s.lineName} (${s.deptName} -> ${s.destName}) dup: ${s.isDuplicate}`);
});

// シナリオ2: 名古屋 -> 大垣 -> 美濃赤坂 -> 米原
const res2 = RouteEngine.searchMarsRoute(graph, window.JR_TRACKS, window.JR_STATIONS, [findId('名古屋'), findId('美濃赤坂'), findId('米原')], { useShinkansen: false, searchMode: 'shortest' });
console.log('--- Scenario 2: Nagoya -> Mino-Akasaka -> Maibara ---');
console.log('Success:', res2.success);
console.log('isOneWay:', res2.isOneWayTrip);
console.log('normalPolylines count:', res2.normalPolylines.length);
console.log('duplicatePolylines count:', res2.duplicatePolylines.length);
res2.sections.forEach(s => {
  console.log(`- ${s.lineName} (${s.deptName} -> ${s.destName}) dup: ${s.isDuplicate}`);
});
