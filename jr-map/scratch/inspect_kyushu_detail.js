const fs = require('fs');
const dump = JSON.parse(fs.readFileSync('C:/Users/Takato Wakuda/.gemini/antigravity-cli/brain/0fed1d73-5ea9-469b-b408-e44b39e3be6d/scratch/batch4_stations_dump.json', 'utf8'));

console.log('=== kyushu-kagoshima stations around 八代 & 川内 ===');
dump['kyushu-kagoshima'].stations.forEach(s => {
  if (['八代', '川内', '隈之城', '新八代', '有佐'].includes(s.name)) {
    console.log(s.idx, s.id, s.name);
  }
});

console.log('=== kyushu-hohi first 5 & last 5 ===');
dump['kyushu-hohi'].stations.slice(0, 5).forEach(s => console.log(s.idx, s.id, s.name));
dump['kyushu-hohi'].stations.slice(-5).forEach(s => console.log(s.idx, s.id, s.name));
