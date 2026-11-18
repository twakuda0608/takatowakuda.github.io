const { JR_LINES, JR_STATIONS } = require('../data/build-data.js');
const { OFFICIAL_STATION_KILOS, applyOfficialKilos } = require('../data/official-kilos.js');
const { JR_TRACKS } = require('../data/tracks.js');
const engine = require('../route-engine.js');

applyOfficialKilos(JR_LINES);

console.log('Testing branches inspection...');
let branchCount = 0;
JR_LINES.forEach(line => {
  const chains = [line.stations, ...(line.branches || [])];
  chains.forEach((chain, cIdx) => {
    if (cIdx > 0) branchCount++;
  });
});
console.log('Total branch chains:', branchCount);
