const fs = require('fs');
const dump = JSON.parse(fs.readFileSync('C:/Users/Takato Wakuda/.gemini/antigravity-cli/brain/0fed1d73-5ea9-469b-b408-e44b39e3be6d/scratch/batch4_stations_dump.json', 'utf8'));
const part3 = JSON.parse(fs.readFileSync('C:/Users/Takato Wakuda/.gemini/antigravity-cli/brain/0fed1d73-5ea9-469b-b408-e44b39e3be6d/scratch/batch4_part3_built.json', 'utf8'));

const soya = dump['hokkaido-soya'].stations;
const kilos = part3['hokkaido-soya'];

let sum = 0;
for (let i = 0; i < soya.length - 1; i++) {
  const u = soya[i].name;
  const v = soya[i+1].name;
  const ku = kilos[u];
  const kv = kilos[v];
  const d = Math.abs(kv - ku);
  sum += d;
  console.log(`${u}(${ku}) -> ${v}(${kv}): ${d.toFixed(1)} km`);
}
console.log('Total sum:', sum.toFixed(1), 'km (expected: 259.4)');
