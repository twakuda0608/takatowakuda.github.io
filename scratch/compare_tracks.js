const fs = require('fs');
const trackCode = fs.readFileSync('jr-map/data/tracks.js', 'utf8');
const window = {};
eval(trackCode);

const tracks = window.JR_TRACKS;

function compareTracks(id1, id2) {
  const t1 = tracks[id1], t2 = tracks[id2];
  console.log(`\nComparing ${id1} vs ${id2}:`);
  console.log(`  ${id1}: chains ${t1 ? t1.length : 0}, points ${t1 && t1[0] ? t1[0].length : 0}`);
  if (t1 && t1[0]) console.log(`    start: [${t1[0][0]}], end: [${t1[0][t1[0].length - 1]}]`);
  console.log(`  ${id2}: chains ${t2 ? t2.length : 0}, points ${t2 && t2[0] ? t2[0].length : 0}`);
  if (t2 && t2[0]) console.log(`    start: [${t2[0][0]}], end: [${t2[0][t2[0].length - 1]}]`);
}

compareTracks('tohoku-main-sendai', 'tohoku-main-morioka');
compareTracks('uetsu-niigata', 'uetsu-north');
compareTracks('ou-main-south', 'ou-main-north');
compareTracks('oito-line', 'oito-west');
