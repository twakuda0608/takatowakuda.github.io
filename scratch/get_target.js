const fs = require('fs');
const content = fs.readFileSync('jr-map/data/tracks.js', 'utf8');
const key = '"sobu-main":';
const idx = content.indexOf(key);
console.log('Index:', idx);
console.log('Context before:', content.slice(idx - 30, idx));
console.log('Key and start:', content.slice(idx, idx + 80));

const nextKey = '"senseki-line":';
const nextIdx = content.indexOf(nextKey, idx);
console.log('nextKey Index:', nextIdx);
console.log('String between:', content.slice(nextIdx - 30, nextIdx + 20));

const exactTarget = content.slice(idx, nextIdx);
console.log('exactTarget length:', exactTarget.length);
console.log('exactTarget ends with:', exactTarget.slice(-20));

// 検証用: exactTarget を replace すると正しく動くか
fs.writeFileSync('scratch/exact_target.txt', exactTarget, 'utf8');
