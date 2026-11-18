const fs = require('fs');
const content = fs.readFileSync('jr-map/data/build-data.js', 'utf8');

// 1. osaka-loop
const loopMatch = content.match(/"id":\s*"osaka-loop"[\s\S]*?"stations":\s*\[([\s\S]*?)\]/);
if (loopMatch) {
  console.log('osaka-loop stations:\n', loopMatch[1]);
}

// 2. sanyo-main
const sanyoMatch = content.match(/"id":\s*"sanyo-main"[\s\S]*?"stations":\s*\[([\s\S]*?)\]/);
if (sanyoMatch) {
  console.log('sanyo-main stations (first 10 lines):\n', sanyoMatch[1].split('\n').slice(0, 10).join('\n'));
}

// 3. sanin-main
const saninMatch = content.match(/"id":\s*"sanin-main"[\s\S]*?"stations":\s*\[([\s\S]*?)\]/);
if (saninMatch) {
  const lines = saninMatch[1].split('\n');
  const senzakiLineIdx = lines.findIndex(l => l.includes('st-dx79'));
  console.log('sanin-main stations around 仙崎:\n', lines.slice(senzakiLineIdx - 3, senzakiLineIdx + 4).join('\n'));
}
