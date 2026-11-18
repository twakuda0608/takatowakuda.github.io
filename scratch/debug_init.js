const fs = require('fs');
const path = require('path');

// 1. 各ファイルの構文・読み込みチェック
const files = [
  'jr-map/data/borders.js',
  'jr-map/data/build-data.js',
  'jr-map/data/tracks.js',
  'jr-map/route-engine.js',
  'jr-map/app.js'
];

for (const f of files) {
  try {
    const code = fs.readFileSync(f, 'utf8');
    new Function(code);
    console.log(`[PASS] ${f} syntax is valid.`);
  } catch (e) {
    console.error(`[FAIL] ${f} syntax error:`, e);
  }
}
