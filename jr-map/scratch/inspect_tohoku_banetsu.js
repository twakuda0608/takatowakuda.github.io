const fs = require('fs');
const dump = JSON.parse(fs.readFileSync('C:/Users/Takato Wakuda/.gemini/antigravity-cli/brain/0fed1d73-5ea9-469b-b408-e44b39e3be6d/scratch/batch4_stations_dump.json', 'utf8'));

console.log('=== banetsu-west ===');
dump['banetsu-west'].stations.forEach(s => console.log(s.idx, s.id, s.name));

console.log('=== tohoku-main around 岩切 / 利府 ===');
dump['tohoku-main'].stations.forEach(s => {
  if (['岩切', '新利府', '利府', '東仙台', '陸前山王'].includes(s.name)) {
    console.log(s.idx, s.id, s.name);
  }
});
