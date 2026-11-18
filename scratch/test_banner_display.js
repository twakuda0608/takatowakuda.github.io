const fs = require('fs');
const dataCode = fs.readFileSync('jr-map/data/build-data.js', 'utf8');
const window = {};
eval(dataCode);

const lines = window.JR_LINES;
['chuo-main', 'tohoku-main', 'joban', 'ou-main', 'uetsu-main', 'oito-line'].forEach(id => {
  const l = lines.find(x => x.id === id);
  console.log(`[${l.id}]`);
  console.log(`  Name: ${l.name}`);
  console.log(`  En:   ${l.en}`);
  console.log(`  Desc: ${l.description} (全${l.stations.length}駅)`);
});
