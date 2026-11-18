const fs = require('fs');
const vm = require('vm');
const sandbox = { window: {}, console, require, module: { exports: {} } };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('C:/Users/Takato Wakuda/.gemini/antigravity-cli/brain/0fed1d73-5ea9-469b-b408-e44b39e3be6d/scratch/official_kilos_final_complete.js', 'utf8'), sandbox);

const kilos = sandbox.window.JR_OFFICIAL_KILOS;
console.log('Total lines in kilos:', Object.keys(kilos).length);

const lines = [];
lines.push('// JR公式営業キロ程データ (第1弾〜第4弾: 全国全JR路線・全駅完全網羅版)');
lines.push('// ※JR時刻表・旅客営業規則に基づく公式累計営業キロ (省略なし完全版)');
lines.push('(function() {');
lines.push('  const OFFICIAL_STATION_KILOS = {');

const keys = Object.keys(kilos);
keys.forEach((k, idx) => {
  const isLast = idx === keys.length - 1;
  const lineObjStr = JSON.stringify(kilos[k]);
  lines.push('    ' + JSON.stringify(k) + ': ' + lineObjStr + (isLast ? '' : ','));
});

lines.push('  };');
lines.push('');
lines.push('  function applyOfficialKilos(lines) {');
lines.push('    if (!lines) return;');
lines.push('    lines.forEach(line => {');
lines.push('      const official = OFFICIAL_STATION_KILOS[line.id];');
lines.push('      if (official) {');
lines.push('        line.stationKilos = official;');
lines.push('      }');
lines.push('    });');
lines.push('  }');
lines.push('');
lines.push('  if (typeof window !== "undefined") {');
lines.push('    window.JR_OFFICIAL_KILOS = OFFICIAL_STATION_KILOS;');
lines.push('    window.applyOfficialKilos = applyOfficialKilos;');
lines.push('    if (window.JR_LINES) {');
lines.push('      applyOfficialKilos(window.JR_LINES);');
lines.push('    }');
lines.push('  }');
lines.push('');
lines.push('  if (typeof module !== "undefined" && module.exports) {');
lines.push('    module.exports = {');
lines.push('      OFFICIAL_STATION_KILOS,');
lines.push('      BATCH1_STATION_KILOS: OFFICIAL_STATION_KILOS,');
lines.push('      applyOfficialKilos');
lines.push('    };');
lines.push('  }');
lines.push('})();');

const output = lines.join('\n');
console.log('Total output lines:', lines.length);
console.log('Total output bytes:', Buffer.byteLength(output, 'utf8'));

fs.writeFileSync('C:/Users/Takato Wakuda/.gemini/antigravity-cli/brain/0fed1d73-5ea9-469b-b408-e44b39e3be6d/scratch/official_kilos_compact.js', output, 'utf8');
console.log('Saved to scratch/official_kilos_compact.js');
