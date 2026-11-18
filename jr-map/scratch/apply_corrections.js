const fs = require('fs');
const oldLines = fs.readFileSync('jr-map/data/official-kilos.js', 'utf8').split('\n');
const newLines = fs.readFileSync('C:/Users/Takato Wakuda/.gemini/antigravity-cli/brain/0fed1d73-5ea9-469b-b408-e44b39e3be6d/official-kilos-updated2.js', 'utf8').split('\n');

const lineIdx = parseInt(process.argv[2], 10);
if (isNaN(lineIdx)) {
  for (let i = 0; i < oldLines.length; i++) {
    if (oldLines[i] !== newLines[i]) {
      const match = oldLines[i].match(/"([^"]+)":/);
      console.log(`Line ${i}: ${match ? match[1] : 'unknown'}`);
    }
  }
} else {
  console.log(`<<<LINE ${lineIdx}>>>`);
  console.log('[[[TARGET]]]');
  console.log(oldLines[lineIdx]);
  console.log('[[[REPLACEMENT]]]');
  console.log(newLines[lineIdx]);
  console.log('<<<END>>>');
}
