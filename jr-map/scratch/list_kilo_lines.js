const fs = require('fs');
const content = fs.readFileSync('jr-map/data/official-kilos.js', 'utf8');
const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
  const match = lines[i].match(/^\s*"([^"]+)":/);
  if (match) {
    console.log(`${i + 1}: ${match[1]}`);
  }
}
