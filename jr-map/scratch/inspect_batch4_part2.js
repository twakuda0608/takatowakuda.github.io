const fs = require('fs');
const dump = JSON.parse(fs.readFileSync('C:/Users/Takato Wakuda/.gemini/antigravity-cli/brain/0fed1d73-5ea9-469b-b408-e44b39e3be6d/scratch/batch4_stations_dump.json', 'utf8'));

const part2Lines = [
  'kamaishi-line',
  'yamada-line',
  'hachinohe-line',
  'hanawa-line',
  'kitakami-line',
  'ofunato-line',
  'tsugaru-line',
  'ominato-line',
  'gonou-line',
  'oga-line',
  'rikuuto-line',
  'rikuusai-line',
  'aterazawa-line'
];

part2Lines.forEach(lineId => {
  const line = dump[lineId];
  console.log(`\n=== ${line.name} (${line.id}): ${line.stations.length} stations ===`);
  const names = line.stations.map(s => s.name);
  console.log(names.join(' -> '));
});
