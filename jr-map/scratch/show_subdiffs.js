const fs = require('fs');
const oldLines = fs.readFileSync('jr-map/data/official-kilos.js', 'utf8').split('\n');
const newLines = fs.readFileSync('C:/Users/Takato Wakuda/.gemini/antigravity-cli/brain/0fed1d73-5ea9-469b-b408-e44b39e3be6d/official-kilos-updated.js', 'utf8').split('\n');

for (let i = 0; i < oldLines.length; i++) {
  if (oldLines[i] === newLines[i]) continue;
  const match = oldLines[i].match(/"([^"]+)":/);
  const lineKey = match ? match[1] : `line ${i}`;
  console.log(`\n=== LINE ${i} (${lineKey}) ===`);
  
  // Extract key-value pairs
  const extractKVs = (str) => {
    const kvs = {};
    const re = /"([^"]+)":([0-9.]+)/g;
    let m;
    while ((m = re.exec(str)) !== null) {
      kvs[m[1]] = m[2];
    }
    return kvs;
  };
  
  const oldKVs = extractKVs(oldLines[i]);
  const newKVs = extractKVs(newLines[i]);
  
  const diffKeys = [];
  for (const k in oldKVs) {
    if (oldKVs[k] !== newKVs[k]) {
      diffKeys.push({ k, oldV: oldKVs[k], newV: newKVs[k] });
    }
  }
  for (const k in newKVs) {
    if (!oldKVs[k]) {
      diffKeys.push({ k, oldV: undefined, newV: newKVs[k] });
    }
  }
  console.log('Diffs count:', diffKeys.length);
  for (const d of diffKeys) {
    console.log(`  "${d.k}": ${d.oldV} -> ${d.newV}`);
  }
}
