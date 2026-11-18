const fs = require('fs');

globalThis.window = globalThis;
eval(fs.readFileSync('jr-map/data/build-data.js', 'utf8'));
eval(fs.readFileSync('jr-map/data/tracks.js', 'utf8'));
const RouteEngine = require('../jr-map/route-engine.js');

const STATIONS = window.JR_STATIONS;
let nagoyaId, maibaraId, ogakiId, taruiId, akasakaId, araoId;
for (const id in STATIONS) {
  const name = STATIONS[id].name;
  if (name === '名古屋') nagoyaId = id;
  if (name === '米原') maibaraId = id;
  if (name === '大垣') ogakiId = id;
  if (name === '垂井') taruiId = id;
  if (name === '美濃赤坂') akasakaId = id;
  if (name === '荒尾') araoId = id;
}

const graph = RouteEngine.buildGraph(window.JR_STATIONS, window.JR_LINES);

const res = RouteEngine.searchMarsRoute(
  graph,
  window.JR_TRACKS,
  window.JR_STATIONS,
  [nagoyaId, maibaraId],
  { useShinkansen: false, searchMode: 'shortest' }
);

console.log('--- Nagoya -> Maibara ---');
console.log('Success:', res.success);
console.log('Mars:', res.marsString);
console.log('TotalKm:', res.totalKm);
console.log('Sections count:', res.sections.length);
res.sections.forEach((s, idx) => {
  console.log(`Section ${idx + 1}: ${s.lineName} (${s.fromName} -> ${s.toName}) [${s.marsName}] stations:`, s.stations.map(id => STATIONS[id]?.name || id).join(', '));
});

