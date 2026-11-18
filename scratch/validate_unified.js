const fs = require('fs');

const brainDir = 'C:\\Users\\Takato Wakuda\\.gemini\\antigravity-cli\\brain\\718ddd58-6a5a-4862-8418-dedf5e77c519\\scratch\\';
const dataCode = fs.readFileSync(brainDir + 'build-data-unified.js', 'utf8');
const trackCode = fs.readFileSync(brainDir + 'tracks-unified.js', 'utf8');

const window = {};
eval(dataCode);
eval(trackCode);

const lines = window.JR_LINES;
const stations = window.JR_STATIONS;
const tracks = window.JR_TRACKS;

console.log('=== Validating Unified Datasets ===');
console.log('Lines count:', lines.length);
console.log('Stations count:', Object.keys(stations).length);
console.log('Tracks count:', Object.keys(tracks).length);

// 1. 各路線のトラック存在確認
let missingTracks = 0;
lines.forEach(l => {
  if (!tracks[l.id] || tracks[l.id].length === 0) {
    console.error(`Missing track for line: [${l.id}] ${l.name}`);
    missingTracks++;
  }
});
console.log('Missing tracks:', missingTracks);

// 2. ターゲット路線の検証
['chuo-main', 'chuo-tatsuno', 'tokai-chuo', 'tohoku-main', 'uetsu-main', 'ou-main', 'oito-line'].forEach(id => {
  const l = lines.find(x => x.id === id);
  if (!l) {
    console.error(`Target line not found: ${id}`);
    return;
  }
  const s0 = stations[l.stations[0]], sN = stations[l.stations[l.stations.length - 1]];
  const t = tracks[id];
  console.log(`[${l.id}] "${l.name}" (${l.color}): ${s0?.name} (${l.stations[0]}) 〜 ${sN?.name} (${l.stations[l.stations.length - 1]})`);
  console.log(`  Stations: ${l.stations.length}, Track chains: ${t.length}, Chain 0 pts: ${t[0].length}`);
  console.log(`  Track start: [${t[0][0]}], end: [${t[0][t[0].length - 1]}]`);
});

// 3. 同一区間の重複チェック
console.log('\n--- Checking for overlapping duplicate lines ---');
for (let i = 0; i < lines.length; i++) {
  for (let j = i + 1; j < lines.length; j++) {
    const l1 = lines[i], l2 = lines[j];
    if (l1.name === l2.name) {
      const s1 = new Set(l1.stations);
      const shared = l2.stations.filter(s => s1.has(s));
      console.log(`Line Name "${l1.name}" shared between [${l1.id}] and [${l2.id}]: ${shared.length} stations:`, shared.map(id => stations[id]?.name || id));
    }
  }
}
