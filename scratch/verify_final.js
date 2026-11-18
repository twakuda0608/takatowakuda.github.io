const fs = require('fs');

globalThis.window = globalThis;
eval(fs.readFileSync('jr-map/data/build-data.js', 'utf8'));
eval(fs.readFileSync('jr-map/data/tracks.js', 'utf8'));
eval(fs.readFileSync('jr-map/route-engine.js', 'utf8'));

const STATIONS = window.JR_STATIONS;
const LINES = window.JR_LINES;
const TRACKS = window.JR_TRACKS;
const RouteEngine = window.JR_ROUTE_ENGINE;

let tokyoId, kyotoId, ogakiId, taruiId, araoId, minoakasakaId, atamiId, shinOsakaId, maibaraId, nagoyaId, mitakaId, takaoId, kofuId;
Object.entries(STATIONS).forEach(([id, st]) => {
  if (st.name === '東京') tokyoId = id;
  if (st.name === '京都') kyotoId = id;
  if (st.name === '大垣') ogakiId = id;
  if (st.name === '垂井') taruiId = id;
  if (st.name === '荒尾') araoId = id;
  if (st.name === '美濃赤坂') minoakasakaId = id;
  if (st.name === '熱海') atamiId = id;
  if (st.name === '新大阪') shinOsakaId = id;
  if (st.name === '米原') maibaraId = id;
  if (st.name === '名古屋') nagoyaId = id;
  if (st.name === '三鷹') mitakaId = id;
  if (st.name === '高尾') takaoId = id;
  if (st.name === '甲府') kofuId = id;
});

let failed = false;
function assert(desc, condition, actual) {
  if (condition) {
    console.log(`[PASS] ${desc}`);
  } else {
    console.error(`[FAIL] ${desc} (Actual: ${actual})`);
    failed = true;
  }
}

console.log('=== 1. 荒尾・大垣〜垂井間ジオメトリ検証 ===');
const ogakiTaruiCoords = RouteEngine.getSegmentCoords(TRACKS, STATIONS, 'tokai-tokaido', ogakiId, taruiId);
let maxLatOgaki = Math.max(...ogakiTaruiCoords.map(p => p[0]));
assert('大垣〜垂井の座標が存在する (count > 0)', ogakiTaruiCoords.length > 50, ogakiTaruiCoords.length);
assert('大垣〜垂井が下側本線を通る (maxLat < 35.375, 新垂井線35.385を通らない)', maxLatOgaki < 35.375, maxLatOgaki);

// 連続点間の最大距離（急降下ワープ判定）
let maxStep = 0;
for (let i = 0; i < ogakiTaruiCoords.length - 1; i++) {
  const dLat = ogakiTaruiCoords[i+1][0] - ogakiTaruiCoords[i][0];
  const dLng = ogakiTaruiCoords[i+1][1] - ogakiTaruiCoords[i][1];
  const step = Math.sqrt(dLat*dLat + dLng*dLng);
  if (step > maxStep) maxStep = step;
}
assert('大垣〜垂井の急降下・直線ジャンプなし (最大ステップ < 0.02度)', maxStep < 0.02, maxStep);

console.log('=== 2. 東京〜京都 営業キロ程検証 ===');
// 在来線 (東海道本線直通)
const r1 = RouteEngine.searchMarsRoute(tokyoId, [], kyotoId, { useShinkansen: false });
assert('東京→京都 (在来線) 成功', r1.success === true, r1.error);
assert('東京→京都 (在来線) 営業キロが 513.6 km と完全一致', r1.totalKm === 513.6, r1.totalKm);
assert('東京→京都 (在来線) 経由が東海道本線直通', r1.marsFormat === '東海道', r1.marsFormat);
assert('東京→京都 (在来線) 片道乗車券 (一筆書き)', r1.isOneWayTrip === true, r1.isOneWayTrip);

// 新幹線 (東海道新幹線)
const r2 = RouteEngine.searchMarsRoute(tokyoId, [], kyotoId, { useShinkansen: true });
assert('東京→京都 (新幹線) 成功', r2.success === true, r2.error);
assert('東京→京都 (新幹線) 営業キロが 513.6 km と完全一致', r2.totalKm === 513.6, r2.totalKm);
assert('東京→京都 (新幹線) 経由が東海新', r2.marsFormat === '東海新', r2.marsFormat);

// 経由地あり (米原経由)
const r3 = RouteEngine.searchMarsRoute(tokyoId, [maibaraId], kyotoId, { useShinkansen: false });
assert('東京→米原→京都 営業キロ 513.6 km', r3.totalKm === 513.6, r3.totalKm);
assert('東京→米原→京都 経由 東海道', r3.marsFormat === '東海道', r3.marsFormat);

// 経由地あり (名古屋経由)
const r4 = RouteEngine.searchMarsRoute(tokyoId, [nagoyaId], kyotoId, { useShinkansen: false });
assert('東京→名古屋→京都 営業キロ 513.6 km', r4.totalKm === 513.6, r4.totalKm);
assert('東京→名古屋→京都 経由 東海道', r4.marsFormat === '東海道', r4.marsFormat);

console.log('=== 3. 中央本線・山手線・その他主要区間公式営業キロ検証 ===');
const rTokyoMitaka = RouteEngine.searchMarsRoute(tokyoId, [], mitakaId, { useShinkansen: false });
assert('東京→三鷹 営業キロ 24.1 km (JR公式・乗換案内と完全一致)', rTokyoMitaka.totalKm === 24.1, rTokyoMitaka.totalKm);

const rTokyoTakao = RouteEngine.searchMarsRoute(tokyoId, [], takaoId, { useShinkansen: false });
assert('東京→高尾 営業キロ 53.1 km', rTokyoTakao.totalKm === 53.1, rTokyoTakao.totalKm);

const rTokyoKofu = RouteEngine.searchMarsRoute(tokyoId, [], kofuId, { useShinkansen: false });
assert('東京→甲府 営業キロ 134.1 km', rTokyoKofu.totalKm === 134.1, rTokyoKofu.totalKm);

const rTokyoAtami = RouteEngine.searchMarsRoute(tokyoId, [], atamiId, { useShinkansen: false });
assert('東京→熱海 営業キロ 104.6 km', rTokyoAtami.totalKm === 104.6, rTokyoAtami.totalKm);

const rTokyoShinOsaka = RouteEngine.searchMarsRoute(tokyoId, [], shinOsakaId, { useShinkansen: true });
assert('東京→新大阪 (新幹線) 営業キロ 552.6 km', rTokyoShinOsaka.totalKm === 552.6, rTokyoShinOsaka.totalKm);

const rMino = RouteEngine.searchMarsRoute(ogakiId, [], minoakasakaId, { useShinkansen: false });
assert('大垣→美濃赤坂 営業キロ 5.0 km', rMino.totalKm === 5.0, rMino.totalKm);

if (failed) {
  process.exit(1);
} else {
  console.log('\n>>> 全テストクリア！ ALL TESTS PASSED! <<<');
}
