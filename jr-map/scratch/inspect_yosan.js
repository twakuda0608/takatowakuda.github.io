const fs = require('fs');
const content = fs.readFileSync('jr-map/data/build-data.js', 'utf8');

const yosanMatch = content.match(/"id":\s*"shikoku-yosan"[\s\S]*?"stations":\s*\[([\s\S]*?)\]/);
if (yosanMatch) {
  const lines = yosanMatch[1].split('\n');
  console.log('yosan stations 60..85:\n', lines.slice(60, 86).join('\n'));
}
