const fs = require('fs');

const dataCode = fs.readFileSync('jr-map/data/build-data.js', 'utf8');
const trackCode = fs.readFileSync('jr-map/data/tracks.js', 'utf8');
const window = {};
eval(dataCode);
eval(trackCode);

const LINES = window.JR_LINES;
const STATIONS = window.JR_STATIONS;
const TRACKS = window.JR_TRACKS;

console.log('=== Checking for lines with duplicate names or overlapping sections ===');

// 1. 同一名称を持つ路線のグループ
const nameMap = {};
LINES.forEach(l => {
  if (!nameMap[l.name]) nameMap[l.name] = [];
  nameMap[l.name].push(l);
});

Object.keys(nameMap).forEach(name => {
  const list = nameMap[name];
  if (list.length > 1) {
    console.log(`\nLine Name: "${name}" has ${list.length} entries:`);
    list.forEach(l => {
      const s0 = STATIONS[l.stations[0]] ? STATIONS[l.stations[0]].name : l.stations[0];
      const sN = STATIONS[l.stations[l.stations.length - 1]] ? STATIONS[l.stations[l.stations.length - 1]].name : l.stations[l.stations.length - 1];
      console.log(`  - ID: ${l.id}, Color: ${l.color}, Section: ${s0} 〜 ${sN} (${l.stations.length} stations)`);
    });

    // 駅の重複をチェック
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const l1 = list[i], l2 = list[j];
        const shared = l1.stations.filter(s => l2.stations.includes(s));
        if (shared.length > 0) {
          console.log(`    WARNING: Overlapping stations between ${l1.id} and ${l2.id} (${shared.length} stations):`, shared.slice(0, 5).map(id => STATIONS[id] ? STATIONS[id].name : id));
        }
      }
    }
  }
});
