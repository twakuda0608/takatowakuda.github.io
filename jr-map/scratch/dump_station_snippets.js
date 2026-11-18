const fs = require('fs');
const lines = fs.readFileSync('jr-map/data/build-data.js', 'utf8').split('\n');

const stationKeys = [
  'st-jfp99',
  'st-b0pr8m', 'st-qn38', 'samukawa', 'st-g3nn', 'st-ed9e', 'st-mfdd5', 'st-l4jc',
  'atsugi', 'ebina', 'st-em42', 'st-dvqq', 'harataima', 'st-km4m', 'kamimizo', 'st-cq3fc', 'hashimoto',
  'st-i38p', 'st-ajvhpe', 'st-lt9t', 'st-dst8l',
  'st-fl6e', 'st-kgo8c6', 'st-ecpab', 'st-e3qsx1', 'st-hudb', 'st-fj0gp', 'st-go0tc', 'st-fogm'
];

stationKeys.forEach(k => {
  const startIdx = lines.findIndex(l => l.startsWith('  "' + k + '": {'));
  if (startIdx >= 0) {
    let endIdx = startIdx;
    while (endIdx < lines.length && lines[endIdx] !== '  },') {
      endIdx++;
    }
    console.log(`// ${k}`);
    console.log(lines.slice(startIdx, endIdx + 1).join('\n'));
    console.log('---');
  }
});
