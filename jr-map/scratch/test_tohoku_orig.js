const fs = require('fs');
let code = fs.readFileSync('jr-map/data/tracks.js', 'utf8');
const cutIdx = code.indexOf('// 東北本線 二重線解消');
code = code.slice(0, cutIdx) + '\nmodule.exports = { JR_TRACKS };\n})();';
fs.writeFileSync('C:/Users/Takato Wakuda/.gemini/antigravity-cli/brain/0fed1d73-5ea9-469b-b408-e44b39e3be6d/scratch/test_tm.js', code);
const { JR_TRACKS } = require('C:/Users/Takato Wakuda/.gemini/antigravity-cli/brain/0fed1d73-5ea9-469b-b408-e44b39e3be6d/scratch/test_tm.js');
const tm = JR_TRACKS['tohoku-main'];
console.log('Original tohoku-main chain count:', tm.length);
console.log('Chain 0 length:', tm[0].length);
console.log('Chain 0 start:', tm[0][0], 'end:', tm[0][tm[0].length - 1]);
console.log('Pt 0:', tm[0][0]);
console.log('Pt 67:', tm[0][67]);
console.log('Pt 68:', tm[0][68]);
console.log('Pt 69:', tm[0][69]);
console.log('Pt 100:', tm[0][100]);
if (tm[1]) {
  console.log('Chain 1 length:', tm[1].length);
  console.log('Chain 1 start:', tm[1][0], 'end:', tm[1][tm[1].length - 1]);
}
