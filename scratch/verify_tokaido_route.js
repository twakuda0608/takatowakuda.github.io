const fs = require('fs');

globalThis.window = globalThis;
eval(fs.readFileSync('jr-map/data/build-data.js', 'utf8'));
eval(fs.readFileSync('jr-map/data/tracks.js', 'utf8'));
const RouteEngine = require('../jr-map/route-engine.js');

// 大垣駅と垂井駅、東京駅、京都駅のIDを探す
const STATIONS = window.JR_STATIONS;
let tokyoId, kyotoId, ogakiId, taruiId, akasakaId;
for (const id in STATIONS) {
  const name = STATIONS[id].name;
  if (name === '東京') tokyoId = id;
  if (name === '京都') kyotoId = id;
  if (name === '大垣') ogakiId = id;
  if (name === '垂井') taruiId = id;
  if (name === '美濃赤坂') akasakaId = id;
}

console.log('Tokyo:', tokyoId, 'Kyoto:', kyotoId, 'Ogaki:', ogakiId, 'Tarui:', taruiId, 'Akasaka:', akasakaId);

// グラフ構築
const graph = RouteEngine.buildGraph(window.JR_STATIONS, window.JR_LINES);

// 1. 東京 → 京都 の探索 (在来線優先/新幹線OFF)
const res1 = RouteEngine.searchMarsRoute(
  graph,
  window.JR_TRACKS,
  window.JR_STATIONS,
  [tokyoId, kyotoId],
  { useShinkansen: false, searchMode: 'shortest' }
);

console.log('--- Tokyo -> Kyoto (No Shinkansen) ---');
console.log('Success:', res1.success);
console.log('Mars:', res1.marsString);
console.log('TotalKm:', res1.totalKm);
const passedNames1 = res1.sections.map(s => s.lineName + ` (${s.fromName}->${s.toName})`);
console.log('Sections:\n', passedNames1.join('\n'));

// 美濃赤坂(akasakaId)を通っていないか確認
const allStationIds1 = [];
res1.sections.forEach(s => s.stations.forEach(st => allStationIds1.push(st.id)));
console.log('Contains Mino-Akasaka?:', allStationIds1.includes(akasakaId));
console.log('Contains Ogaki?:', allStationIds1.includes(ogakiId));
console.log('Contains Tarui?:', allStationIds1.includes(taruiId));

// 大垣の次の駅をチェック
const ogakiIdx = allStationIds1.indexOf(ogakiId);
if (ogakiIdx !== -1) {
  console.log('Station after Ogaki:', STATIONS[allStationIds1[ogakiIdx + 1]]?.name);
}
