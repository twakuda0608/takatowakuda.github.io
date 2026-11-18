const { JR_TRACKS } = require('../data/tracks.js');
const { JR_LINES, JR_STATIONS } = require('../data/build-data.js');

const branchLines = [
  'hokkaido-hakodate-sawara',
  'hokkaido-muroran-branch',
  'sanyo-wadamisaki',
  'sanin-senzaki',
  'kyushu-nagasaki-nagayo',
  'hokkaido-chitose-airport'
];

for (const lineId of branchLines) {
  const line = JR_LINES.find(l => l.id === lineId);
  const chains = JR_TRACKS[lineId];
  console.log(`\n=== Line: ${lineId} (${line?.name}) ===`);
  console.log('Chains:', chains?.length);
  if (chains && chains.length > 0) {
    chains.forEach((c, idx) => {
      console.log(`  Chain ${idx}: ${c.length} pts, start: [${c[0]}], end: [${c[c.length-1]}]`);
    });
  }
  console.log('Stations:');
  line?.stations.forEach(stId => {
    const st = JR_STATIONS[stId];
    console.log(`  ${st?.name} (${stId}): [${st?.lat}, ${st?.lng}]`);
  });
}
