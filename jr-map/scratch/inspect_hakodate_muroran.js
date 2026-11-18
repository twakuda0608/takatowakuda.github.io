const fs = require('fs');
const dump = JSON.parse(fs.readFileSync('C:/Users/Takato Wakuda/.gemini/antigravity-cli/brain/0fed1d73-5ea9-469b-b408-e44b39e3be6d/scratch/batch4_stations_dump.json', 'utf8'));

console.log('=== hokkaido-hakodate stations ===');
dump['hokkaido-hakodate'].stations.forEach(s => console.log(`${s.idx}: ${s.name} (${s.id})`));

console.log('=== hokkaido-muroran stations ===');
dump['hokkaido-muroran'].stations.forEach(s => console.log(`${s.idx}: ${s.name} (${s.id})`));
