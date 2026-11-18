const { JR_LINES, JR_STATIONS } = require('../data/build-data.js');
const { applyOfficialKilos } = require('../data/official-kilos.js');
const engine = require('../route-engine.js');

applyOfficialKilos(JR_LINES);
const graph = engine.buildGraph(JR_LINES, JR_STATIONS);

console.log('--- Test 1: Loop Edge (Osaka Loop: 天王寺 <-> 新今宮) ---');
const tennojiEdges = graph.get('st-dmapk') || [];
const toShinImamiya = tennojiEdges.filter(e => e.to === 'st-fa3mc');
console.log('天王寺 -> 新今宮 edges:', toShinImamiya.map(e => ({ line: e.lineName, mars: e.marsName, dist: e.dist })));

const shinImamiyaEdges = graph.get('st-fa3mc') || [];
const toTennoji = shinImamiyaEdges.filter(e => e.to === 'st-dmapk');
console.log('新今宮 -> 天王寺 edges:', toTennoji.map(e => ({ line: e.lineName, mars: e.marsName, dist: e.dist })));

console.log('\n--- Test 2: Search Route (天王寺 -> 新今宮) ---');
const resLoop = engine.searchMarsRoute(graph, null, JR_STATIONS, ['st-dmapk', 'st-fa3mc'], { searchMode: 'shortest' });
console.log('Success:', resLoop.success, 'Total dist:', resLoop.totalDist, 'Sections:', resLoop.sections.length);
if (resLoop.sections.length > 0) {
  console.log('First section:', resLoop.sections[0].deptName, '->', resLoop.sections[0].destName, resLoop.sections[0].lineName, resLoop.sections[0].km);
}

console.log('\n--- Test 3: One-Way Mode with Via Stations ---');
// 東京 -> 新宿 -> 品川 (一筆書き)
// 東京 -> 新宿 (中央線 10.3km)
// 新宿 -> 品川 (山手線 10.6km)
const resOneWay = engine.searchMarsRoute(graph, null, JR_STATIONS, ['tokyo', 'shinjuku', 'shinagawa'], { searchMode: 'oneway' });
console.log('OneWay Success:', resOneWay.success, 'Total dist:', resOneWay.totalDist, 'isOneWayTrip:', resOneWay.isOneWayTrip);
console.log('Route lines:', resOneWay.lineRuns.map(r => `${r.lineName}: ${r.dist}km`));

console.log('\n--- Test 4: One-Way Failure Check (Cannot revisit) ---');
// 東京 -> 新宿 -> 東京 (一筆書き不可能)
const resRevisit = engine.searchMarsRoute(graph, null, JR_STATIONS, ['tokyo', 'shinjuku', 'tokyo'], { searchMode: 'oneway' });
console.log('Revisit success (should be false):', resRevisit.success, 'Error:', resRevisit.error);

console.log('\n--- Test 5: MARS Names Check ---');
const testLines = [
  { id: 'ako-line', name: '赤穂線' },
  { id: 'akaho-line', name: '赤穂線' },
  { id: 'imbi-line', name: '因美線' },
  { id: 'inbi-line', name: '因美線' },
  { id: 'oito-west', name: '大糸線' },
  { id: 'sanin-wadayama', name: '山陰本線' }
];
testLines.forEach(l => {
  console.log(`${l.id}: ${engine.getMarsLineName(l)}`);
});
