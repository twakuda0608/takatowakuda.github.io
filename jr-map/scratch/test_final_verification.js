const { JR_LINES, JR_STATIONS } = require('../data/build-data.js');
const { applyOfficialKilos } = require('../data/official-kilos.js');
const engine = require('../route-engine.js');

applyOfficialKilos(JR_LINES);
const graph = engine.buildGraph(JR_LINES, JR_STATIONS);

console.log('--- Test 1: 鹿児島本線（八代〜川内の直結ワープがないこと） ---');
// 八代 (st-ea54) -> 川内 (st-gevc-1)
// 在来線のみ（新幹線不可）で探索した場合、直結エッジがないためJR在来線のみでは繋がらない（または新幹線経由のみ）
const resKago = engine.searchMarsRoute(graph, null, JR_STATIONS, ['st-ea54', 'st-gevc-1'], { searchMode: 'shortest', useShinkansen: false });
console.log('八代〜川内 在来線ルート成功 (分断されているため false であるべき):', resKago.success, resKago.error);

console.log('\n--- Test 2: 根室本線（富良野〜新得の廃止区間直結がないこと） ---');
// 富良野 (st-e311n) -> 新得 (st-htk7)
const resNemu = engine.searchMarsRoute(graph, null, JR_STATIONS, ['st-e311n', 'st-htk7'], { searchMode: 'shortest', useShinkansen: false });
console.log('富良野〜新得 直結ルート成功 (分断されているため false であるべき):', resNemu.success, resNemu.error);

console.log('\n--- Test 3: 東海道本線 鶴見・東神奈川・保土ケ谷 経由 ---');
// 品川 -> 鶴見
const resTsurumi = engine.searchMarsRoute(graph, null, JR_STATIONS, ['shinagawa', 'tsurumi'], { searchMode: 'shortest', useShinkansen: false });
console.log('品川〜鶴見 探索成功:', resTsurumi.success, 'km:', resTsurumi.totalKm, 'line:', resTsurumi.sections[0]?.lineName);

console.log('\n--- Test 4: 埼京線 北与野〜大宮 1.6km ---');
const resSaikyo = engine.searchMarsRoute(graph, null, JR_STATIONS, ['st-ck7h3', 'omiya'], { searchMode: 'shortest', useShinkansen: false });
console.log('北与野〜大宮 探索成功:', resSaikyo.success, 'km (1.6kmであるべき):', resSaikyo.totalKm);
