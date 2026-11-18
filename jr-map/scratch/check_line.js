const fs = require('fs');
const oldL = fs.readFileSync('jr-map/data/official-kilos.js', 'utf8').split('\n')[104];
const newL = fs.readFileSync('C:/Users/Takato Wakuda/.gemini/antigravity-cli/brain/0fed1d73-5ea9-469b-b408-e44b39e3be6d/official-kilos-updated.js', 'utf8').split('\n')[104];

console.log('oldL === newL:', oldL === newL);
const oldClean = '{' + oldL.trim().replace(/^"sanin-main":\s*/, '').replace(/,$/, '') + '}';
const newClean = '{' + newL.trim().replace(/^"sanin-main":\s*/, '').replace(/,$/, '') + '}';
const oldObj = JSON.parse(oldClean);
const newObj = JSON.parse(newClean);

const diffs = [];
for (const k in oldObj) {
  if (oldObj[k] !== newObj[k]) diffs.push({ k, oldV: oldObj[k], newV: newObj[k] });
}
console.log('Diffs:', diffs);
