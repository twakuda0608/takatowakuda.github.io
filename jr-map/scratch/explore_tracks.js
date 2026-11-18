const { JR_TRACKS } = require('../data/tracks.js');
const { JR_LINES, JR_STATIONS } = require('../data/build-data.js');

console.log('All line IDs in JR_TRACKS:');
const keys = Object.keys(JR_TRACKS);
console.log('Total line keys:', keys.length);

// Let's check shikoku-yosan chains
const yosanChains = JR_TRACKS['shikoku-yosan'];
console.log('shikoku-yosan chains count:', yosanChains?.length);
if (yosanChains) {
  yosanChains.forEach((c, i) => {
    console.log(`Chain ${i}: ${c.length} pts, start: [${c[0]}], end: [${c[c.length-1]}]`);
  });
}
