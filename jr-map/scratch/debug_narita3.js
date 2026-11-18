const fs = require('fs');
const content = fs.readFileSync('jr-map/data/tracks.js', 'utf8');

// Find original "narita-line":
const match = content.match(/"narita-line":(\[\[.*?\]\])/);
if (match) {
  const original = JSON.parse(match[1]);
  console.log('Original narita-line chains count:', original.length);
  original.forEach((c, i) => console.log(`Chain ${i}: len ${c.length}, start:`, c[0], 'end:', c[c.length - 1]));
}
