const fs = require('fs');
const dump = JSON.parse(fs.readFileSync('C:/Users/Takato Wakuda/.gemini/antigravity-cli/brain/0fed1d73-5ea9-469b-b408-e44b39e3be6d/scratch/batch4_stations_dump.json', 'utf8'));

['uetsu-main', 'ou-main', 'banetsu-east', 'senzan-line', 'senseki-line', 'ishinomaki-line', 'tazawako-line'].forEach(id => {
  const line = dump[id];
  console.log(`\n=== ${line.name} (${line.id}) [${line.stations.length} stations] ===`);
  line.stations.forEach(s => console.log(`  ${s.idx}: ${s.name} (${s.id})`));
});
