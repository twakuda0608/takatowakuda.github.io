const fs = require('fs');
globalThis.window = globalThis;
eval(fs.readFileSync('jr-map/data/build-data.js', 'utf8'));
eval(fs.readFileSync('jr-map/data/tracks.js', 'utf8'));
const RouteEngine = require('../jr-map/route-engine.js');
const STATIONS = window.JR_STATIONS;

function findId(name) {
  for (const id in STATIONS) {
    if (STATIONS[id].name === name) return id;
  }
}

const graph = RouteEngine.buildGraph(window.JR_STATIONS, window.JR_LINES);

// findLeg の transferPenalty を変化させてテスト
[1.5, 5, 10, 15, 20].forEach(penalty => {
  // route-engine の findLeg の transferPenalty を上書きシミュレート
  function testWithPenalty(p) {
    // route-engine.js のコードを差し替えて実行
    const code = fs.readFileSync('jr-map/route-engine.js', 'utf8');
    const modifiedCode = code.replace(
      'const transferPenalty = (prevInfo && prevInfo.lineId !== edge.lineId) ? 1.5 : 0;',
      `const transferPenalty = (prevInfo && prevInfo.lineId !== edge.lineId) ? ${p} : 0;`
    );
    const customEngine = eval(modifiedCode + '; RouteEngine;');
    const g = customEngine.buildGraph(window.JR_STATIONS, window.JR_LINES);
    
    // 東京 -> 京都 (在来線のみ)
    const resTokyoKyoto = customEngine.searchMarsRoute(g, window.JR_TRACKS, window.JR_STATIONS, [findId('東京'), findId('京都')], { useShinkansen: false });
    
    // 東京 -> 米原 -> 京都
    const resTokyoMaibaraKyoto = customEngine.searchMarsRoute(g, window.JR_TRACKS, window.JR_STATIONS, [findId('東京'), findId('米原'), findId('京都')], { useShinkansen: false });

    console.log(`Penalty: ${p} km`);
    console.log(`  Tokyo -> Kyoto: ${resTokyoKyoto.marsString} (${resTokyoKyoto.totalKm} km)`);
    console.log(`  Tokyo -> Maibara -> Kyoto: ${resTokyoMaibaraKyoto.marsString} (${resTokyoMaibaraKyoto.totalKm} km)`);
  }
  testWithPenalty(penalty);
});
