const fs = require('fs');

const dataCode = fs.readFileSync('jr-map/data/build-data.js', 'utf8');
const trackCode = fs.readFileSync('jr-map/data/tracks.js', 'utf8');
const window = {};
eval(dataCode);
eval(trackCode);

console.log("Checking all line pairs for track/station duplicates...");
const lines = window.JR_LINES;
const tracks = window.JR_TRACKS;
const stations = window.JR_STATIONS;

for (let i = 0; i < lines.length; i++) {
  for (let j = i + 1; j < lines.length; j++) {
    const l1 = lines[i], l2 = lines[j];
    const s1 = new Set(l1.stations);
    const shared = l2.stations.filter(s => s1.has(s));
    if (shared.length > 2) {
      console.log(`Shared stations > 2 between [${l1.id}] "${l1.name}" (${l1.stations.length}) and [${l2.id}] "${l2.name}" (${l2.stations.length}): ${shared.length} stations`);
      console.log(`  Overlap: ${shared.slice(0, 3).map(id => stations[id]?.name || id).join(', ')} ... ${shared.slice(-3).map(id => stations[id]?.name || id).join(', ')}`);
    }
  }
}
