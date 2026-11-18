const fs = require('fs');
globalThis.window = globalThis;
eval(fs.readFileSync('jr-map/data/build-data.js', 'utf8'));
eval(fs.readFileSync('jr-map/data/tracks.js', 'utf8'));
const STATIONS = window.JR_STATIONS;

function findId(name) {
  for (const id in STATIONS) {
    if (STATIONS[id].name === name) return id;
  }
}

// route-engine.js のコードを読み込み、乗り換え判定を marsName に変更してテスト
const code = fs.readFileSync('jr-map/route-engine.js', 'utf8');

[0, 2, 5, 8, 10].forEach(penalty => {
  const modifiedCode = code.replace(
    'const transferPenalty = (prevInfo && prevInfo.lineId !== edge.lineId) ? 1.5 : 0;',
    `const transferPenalty = (prevInfo && prevInfo.marsName !== edge.marsName) ? ${penalty} : 0;`
  );
  eval(modifiedCode);
  const customEngine = window.JR_ROUTE_ENGINE;
  const g = customEngine.buildGraph(window.JR_STATIONS, window.JR_LINES);

  const resTokyoMaibara = customEngine.searchMarsRoute(g, window.JR_TRACKS, window.JR_STATIONS, [findId('東京'), findId('米原')], { useShinkansen: false });
  const resTokyoKyoto = customEngine.searchMarsRoute(g, window.JR_TRACKS, window.JR_STATIONS, [findId('東京'), findId('京都')], { useShinkansen: false });

  console.log(`Penalty: ${penalty} km (by marsName)`);
  console.log(`  Tokyo -> Maibara: ${resTokyoMaibara.marsString} (${resTokyoMaibara.totalKm} km)`);
  console.log(`  Tokyo -> Kyoto: ${resTokyoKyoto.marsString} (${resTokyoKyoto.totalKm} km)`);
});
