const fs = require('fs');
const assert = require('assert');

// 1. データとエンジン読み込み
const data = require('../jr-map/data/build-data.js');
const kilosMod = require('../jr-map/data/official-kilos.js');
const RouteEngine = require('../jr-map/route-engine.js');

// official-kilos を適用
kilosMod.applyOfficialKilos(data.JR_LINES);

const graph = RouteEngine.buildGraph(data.JR_LINES, data.JR_STATIONS);
const stations = data.JR_STATIONS;

console.log('=== テスト 1: 第1弾路線の公式営業キロ検証 ===');

function testRoute(fromNameOrId, toNameOrId, expectedKm, expectedLineName, options = {}) {
  // 駅名または駅IDからIDを決定
  const fromId = stations[fromNameOrId] ? fromNameOrId : Object.keys(stations).find(id => stations[id].name === fromNameOrId);
  const toId = stations[toNameOrId] ? toNameOrId : Object.keys(stations).find(id => stations[id].name === toNameOrId);
  assert(fromId, `駅が見つかりません: ${fromNameOrId}`);
  assert(toId, `駅が見つかりません: ${toNameOrId}`);

  const fromName = stations[fromId].name;
  const toName = stations[toId].name;

  const res = RouteEngine.searchMarsRoute(graph, null, stations, [fromId, toId], options);
  assert(res.success, `経路探索失敗: ${fromName} -> ${toName}: ${res.error}`);
  console.log(`[PASS] ${fromName} -> ${toName}: ${res.totalKm} km (期待値: ${expectedKm} km, 経由: ${res.marsString})`);
  assert.strictEqual(res.totalKm, expectedKm, `${fromName} -> ${toName} の営業キロが不一致: 実際 ${res.totalKm} vs 期待 ${expectedKm}`);
  return res;
}

// 関東・甲信越主要区間
testRoute('東京', '三鷹', 24.1);
testRoute('東京', '高尾', 53.1);
testRoute('東京', '甲府', 134.1);
testRoute('東京', '塩尻', 222.1);
testRoute('品川', '田端', 20.6);
testRoute('大船', '久里浜', 23.9);
testRoute('東京', '蘇我', 43.0);
testRoute('府中本町', '西船橋', 71.8);
testRoute('大宮', '高崎', 74.7);
testRoute('立川', '奥多摩', 37.2);
testRoute('takasaki', 'st-ikmr', 29.7); // 高崎 -> 横川(信越本線)
testRoute('小諸', '小淵沢', 78.9);
testRoute('松本', 'itoigawa', 105.4);
testRoute('柏崎', 'niigata', 83.8);

console.log('=== テスト 2: 全新幹線10路線の公式並行在来線キロ検証 ===');
testRoute('東京', '新大阪', 552.6, null, { useShinkansen: true });
testRoute('新大阪', '博多', 640.6, null, { useShinkansen: true });
testRoute('東京', '新青森', 713.7, null, { useShinkansen: true });
testRoute('新青森', '新函館北斗', 148.8, null, { useShinkansen: true });
testRoute('東京', '新潟', 300.5, null, { useShinkansen: true });
// 東京 -> 敦賀 は米原経由(489.9km)のほうが短いため、北陸新幹線直通テストは金沢経由を指定
{
  const res = RouteEngine.searchMarsRoute(graph, null, stations, ['tokyo', 'kanazawa', 'tsuruga'], { useShinkansen: true });
  console.log(`[PASS] 東京 -> 金沢 -> 敦賀 (北陸新幹線全通): ${res.totalKm} km (期待値: 579.2 km, 経由: ${res.marsString})`);
  assert.strictEqual(res.totalKm, 579.2);
}
testRoute('博多', '鹿児島中央', 256.8, null, { useShinkansen: true });
testRoute('武雄温泉', '長崎', 66.0, null, { useShinkansen: true });
testRoute('tokyo', 'shinjo', 421.4, null, { useShinkansen: true }); // 山形新幹線
// 東京 -> 秋田 は山形・奥羽本線経由のほうが短いため、秋田新幹線(盛岡経由)を検証
{
  const res = RouteEngine.searchMarsRoute(graph, null, stations, ['tokyo', 'morioka', 'akita'], { useShinkansen: true });
  console.log(`[PASS] 東京 -> 盛岡 -> 秋田 (秋田新幹線全通): ${res.totalKm} km (期待値: 662.6 km, 経由: ${res.marsString})`);
  assert.strictEqual(res.totalKm, 662.6);
}

console.log('=== テスト 3: 概算距離警告 (hasEstimatedDistance / unregisteredLines) の検証 ===');

// 3-a: 第1弾登録済み路線のみのルート (東京〜高尾) では警告が出ないこと
const safeRes = testRoute('東京', '高尾', 53.1);
assert.strictEqual(safeRes.hasEstimatedDistance, false, '登録済みルートで hasEstimatedDistance が true になっています');
assert.strictEqual(safeRes.unregisteredLines.length, 0, '登録済みルートで unregisteredLines が空ではありません');
console.log('[PASS] 登録済み区間 (東京〜高尾): hasEstimatedDistance = false, unregisteredLines = []');

// 3-b: 未登録区間（第2弾〜第4弾の路線、例えば関西本線や日豊本線など）を含むルートでの警告テスト
// 意図的に stationKilos がない路線を通る経路をテスト
const kansaId = Object.keys(stations).find(id => stations[id].name === '亀山');
const nagoyaId = Object.keys(stations).find(id => stations[id].name === '名古屋');
if (kansaId && nagoyaId) {
  const estRes = RouteEngine.searchMarsRoute(graph, null, stations, [nagoyaId, kansaId], { useShinkansen: false });
  console.log(`[INFO] 名古屋 -> 亀山: totalKm = ${estRes.totalKm}, hasEstimatedDistance = ${estRes.hasEstimatedDistance}, unregistered = ${estRes.unregisteredLines.join(',')}`);
  assert.strictEqual(estRes.hasEstimatedDistance, true, '未登録区間を含むルートで hasEstimatedDistance が false です');
  assert(estRes.unregisteredLines.length > 0, 'unregisteredLines が空です');
  console.log(`[PASS] 未登録区間を含むルート (名古屋〜亀山): ※概算距離を含む（未登録路線: ${estRes.unregisteredLines.join('、')}）が正しく検出されました`);
}

console.log('\n>>> 全テストクリア！ ALL TESTS PASSED! <<<');
