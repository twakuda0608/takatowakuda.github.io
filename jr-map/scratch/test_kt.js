const fs = require('fs');
const { JR_TRACKS } = require('C:/Users/Takato Wakuda/.gemini/antigravity-cli/brain/0fed1d73-5ea9-469b-b408-e44b39e3be6d/scratch/test_tm.js');
const kt = JR_TRACKS['keihin-tohoku'];
console.log('Keihin-Tohoku chain count:', kt.length);
for (let c = 0; c < kt.length; c++) {
  console.log(`Chain ${c}: len=${kt[c].length}, start=${kt[c][0]}, end=${kt[c][kt[c].length-1]}`);
}
