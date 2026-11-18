const fs = require('fs');
const content = fs.readFileSync('jr-map/data/build-data.js', 'utf8');

function showStationsAround(id, targetSt) {
  const p = content.indexOf(`"id": "${id}"`);
  const end = content.indexOf('],', p);
  const block = content.slice(p, end);
  const targetPos = block.indexOf(targetSt);
  console.log(`=== ${id} around ${targetSt} ===`);
  console.log(block.slice(Math.max(0, targetPos - 150), Math.min(block.length, targetPos + 150)));
}

// kyushu-kyudai around 南由布/由布院
showStationsAround('kyushu-kyudai', 'st-crwcp'); // 南由布
// kyushu-nichinan around 日向大束/日向北方
showStationsAround('kyushu-nichinan', 'st-d7ex9g'); // 日向大束
// hokkaido-chitose around 新千歳空港
showStationsAround('hokkaido-chitose', 'st-1hea2id');
// hokkaido-muroran around 輪西
showStationsAround('hokkaido-muroran', 'st-p3th');
// hokkaido-hakodate around 渡島砂原
showStationsAround('hokkaido-hakodate', 'st-ea8z2q');
