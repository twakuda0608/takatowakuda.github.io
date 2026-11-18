const fs = require('fs');

const dataCode = fs.readFileSync('jr-map/data/build-data.js', 'utf8');
const trackCode = fs.readFileSync('jr-map/data/tracks.js', 'utf8');
const window = {};
eval(dataCode);
eval(trackCode);

const lines = window.JR_LINES;
const tracks = window.JR_TRACKS;
const stations = window.JR_STATIONS;

function inspectLine(id) {
  const l = lines.find(x => x.id === id);
  if (!l) {
    console.log(`Line ${id} not found in JR_LINES`);
    return;
  }
  const t = tracks[id];
  console.log(`\n=== Line: [${l.id}] ${l.name} (${l.color}) ===`);
  console.log(`Stations count: ${l.stations.length}`);
  const s0 = stations[l.stations[0]], sN = stations[l.stations[l.stations.length - 1]];
  console.log(`Start: ${s0?.name} (${l.stations[0]}) [${s0?.lat}, ${s0?.lng}]`);
  console.log(`End:   ${sN?.name} (${l.stations[l.stations.length - 1]}) [${sN?.lat}, ${sN?.lng}]`);
  console.log(`Tracks chains: ${t ? t.length : 0}`);
  if (t && t[0]) {
    console.log(`Chain 0 points: ${t[0].length}`);
    console.log(`Track Start: [${t[0][0]}]`);
    console.log(`Track End:   [${t[0][t[0].length - 1]}]`);
  }
}

['chuo-rapid', 'chuo-main', 'chuo-tatsuno', 'tokai-chuo',
 'utsunomiya-line', 'tohoku-main-sendai', 'tohoku-main-morioka',
 'uetsu-niigata', 'uetsu-north',
 'ou-main-south', 'ou-main-north',
 'oito-line', 'oito-west'
].forEach(inspectLine);
