const fs = require('fs');
const dump = JSON.parse(fs.readFileSync('C:/Users/Takato Wakuda/.gemini/antigravity-cli/brain/0fed1d73-5ea9-469b-b408-e44b39e3be6d/scratch/batch4_stations_dump.json', 'utf8'));

const part1Lines = [
  'tohoku-main',
  'uetsu-main',
  'ou-main',
  'banetsu-west',
  'banetsu-east',
  'senzan-line',
  'senseki-line',
  'ishinomaki-line',
  'tazawako-line'
];

part1Lines.forEach(lineId => {
  const line = dump[lineId];
  console.log(`=== ${line.name} (${line.id}): ${line.stations.length} stations ===`);
  const names = line.stations.map(s => s.name);
  console.log('Start:', names.slice(0, 5).join(' -> '));
  console.log('End:', names.slice(-5).join(' -> '));
});
