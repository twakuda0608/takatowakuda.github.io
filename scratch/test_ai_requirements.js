const fs = require('fs');

globalThis.window = globalThis;
eval(fs.readFileSync('jr-map/data/build-data.js', 'utf8'));
eval(fs.readFileSync('jr-map/data/tracks.js', 'utf8'));
eval(fs.readFileSync('jr-map/route-engine.js', 'utf8'));

const STATIONS = window.JR_STATIONS;
const LINES = window.JR_LINES;
const RouteEngine = window.JR_ROUTE_ENGINE;

let passed = true;
function assert(desc, cond, actual) {
  if (cond) {
    console.log(`[PASS] ${desc}`);
  } else {
    console.error(`[FAIL] ${desc} (Actual: ${actual})`);
    passed = false;
  }
}

console.log('=== テスト 1: 路線データ (line.stationKilos) に直接定義された営業キロの最優先参照 ===');
// 架空またはテスト用路線で line.stationKilos を定義してみる
const testLine = {
  id: 'test-line',
  name: 'テスト線',
  category: 'conventional',
  stations: ['tokyo', 'kanda', 'ochanomizu'],
  stationKilos: {
    'tokyo': 0.0,
    'kanda': 1.5,       // 公式(1.3)とあえて違う値にして、直接定義が優先されるか検証
    'ochanomizu': 3.0   // 公式(2.6)とあえて違う値
  }
};
const testGraph = RouteEngine.buildGraph([testLine], STATIONS);
const edgesFromTokyo = testGraph.get('tokyo') || [];
const edgeTokyoKanda = edgesFromTokyo.find(e => e.to === 'kanda');
assert('line.stationKilos が最優先で参照される (0.0 -> 1.5 = 1.5km)', edgeTokyoKanda && edgeTokyoKanda.dist === 1.5, edgeTokyoKanda ? edgeTokyoKanda.dist : 'none');

console.log('=== テスト 2: 路線データ (line.edgeDistances) の参照 ===');
const testLine2 = {
  id: 'test-line-edge',
  name: 'テスト線2',
  category: 'conventional',
  stations: ['tokyo', 'kanda'],
  edgeDistances: {
    'tokyo-kanda': 1.8
  }
};
const testGraph2 = RouteEngine.buildGraph([testLine2], STATIONS);
const edgesFromTokyo2 = testGraph2.get('tokyo') || [];
const edge2 = edgesFromTokyo2.find(e => e.to === 'kanda');
assert('line.edgeDistances が参照される (1.8km)', edge2 && edge2.dist === 1.8, edge2 ? edge2.dist : 'none');

console.log('=== テスト 3: stationKilos未設定時の内蔵 OFFICIAL_LINE_KILOS 参照 (優先度2) ===');
// 全路線グラフを再構築
RouteEngine.buildGraph(LINES, STATIONS);

// 中央線（東京〜三鷹: 24.1km）
const rMitaka = RouteEngine.searchMarsRoute('tokyo', [], 'mitaka');
assert('東京 -> 三鷹 が公式営業キロ 24.1 km と完全一致', rMitaka.totalKm === 24.1, rMitaka.totalKm);

// 東海道線（東京〜京都: 513.6km）
let kyotoId;
for (const id in STATIONS) { if (STATIONS[id].name === '京都') kyotoId = id; }
const rKyoto = RouteEngine.searchMarsRoute('tokyo', [], kyotoId, { useShinkansen: false });
assert('東京 -> 京都 (在来線) が 513.6 km と完全一致', rKyoto.totalKm === 513.6, rKyoto.totalKm);

console.log('=== テスト 4: 新幹線と並行在来線の営業キロルール (旅客営業規則第14条・第16条) ===');
const rShinkansenKyoto = RouteEngine.searchMarsRoute('tokyo', [], kyotoId, { useShinkansen: true });
assert('東京 -> 京都 (新幹線) が並行在来線営業キロ 513.6 km と完全一致', rShinkansenKyoto.totalKm === 513.6, rShinkansenKyoto.totalKm);

let shinOsakaId;
for (const id in STATIONS) { if (STATIONS[id].name === '新大阪') shinOsakaId = id; }
const rShinkansenOsaka = RouteEngine.searchMarsRoute('tokyo', [], shinOsakaId, { useShinkansen: true });
assert('東京 -> 新大阪 (新幹線) が並行在来線営業キロ 552.6 km と完全一致', rShinkansenOsaka.totalKm === 552.6, rShinkansenOsaka.totalKm);

console.log('=== テスト 5: 浮動小数点加算誤差の防止 (0.1km単位・整数計算) ===');
// 各セクションの km と totalKm に 341.3000000000001 のような誤差がないことを確認
rKyoto.sections.forEach(s => {
  const isClean = String(s.km).split('.')[1]?.length <= 1 || !String(s.km).includes('.');
  assert(`セクション ${s.lineName} (${s.km}km) に浮動小数点誤差なし`, isClean, s.km);
});
const totalClean = String(rKyoto.totalKm).split('.')[1]?.length <= 1 || !String(rKyoto.totalKm).includes('.');
assert(`totalKm (${rKyoto.totalKm}km) に浮動小数点誤差なし`, totalClean, rKyoto.totalKm);

if (passed) {
  console.log('\n>>> 全要求仕様のテストに合格しました！ <<<');
} else {
  process.exit(1);
}
