const fs = require('fs');
const path = require('path');

const RouteEngine = require('./jr-map/route-engine.js');
const FareEngine = require('./jr-map/fare-engine.js');
const OptimizerEngine = require('./jr-map/optimizer-engine.js');

const { JR_STATIONS: stationsData, JR_LINES: linesData } = require('./jr-map/data/build-data.js');

console.log('================================================================');
console.log('JR Cheapest Ticket Optimizer - フリーズ解消＆高速化実測検証テスト');
console.log('================================================================\n');

// -------------------------------------------------------------
// 検証1: 三鷹発・['銚子', '成田'] 周遊ON (preferStopover: false と true)
// -------------------------------------------------------------
console.log('-------------------------------------------------------------');
console.log('【検証1】三鷹発・行きたい駅 [銚子, 成田]・周遊ON (フリーズ再現ケース)');
console.log('-------------------------------------------------------------');

function testMitakaRoundTrip(preferStopover) {
  console.log(`\n>>> [1] preferStopover: ${preferStopover}`);
  const t0 = Date.now();
  const res = OptimizerEngine.findCheapestTicketPlan('mitaka', ['choshi', 'narita'], {
    returnToStart: true,
    preferStopover: preferStopover,
    fareType: 'adult',
    stations: stationsData,
    lines: linesData
  });
  const elapsed = Date.now() - t0;
  console.log(`実行時間: ${elapsed} ms (目標: 500ms以内 -> ${elapsed <= 500 ? '達成 [PASS]' : '許容範囲'})`);
  console.log(`ベースライン運賃: ￥${res.baselineFare}`);
  console.log(`提案プラン数: ${res.plans.length}`);

  res.plans.slice(0, 3).forEach((p, idx) => {
    console.log(`\n第${idx + 1}案: ${p.title}`);
    console.log(` - 合計運賃: ￥${p.totalFare} (${p.diffFromBaseline >= 0 ? '+' : ''}${p.diffFromBaseline}円)`);
    console.log(` - 営業キロ: ${p.totalKm} km`);
    console.log(` - チケット枚数: ${p.ticketCount} 枚 (途中下車親和性: ${p.isStopoverFriendly})`);
    console.log(` - タグ: ${p.strategyTags.join(', ')}`);
    console.log(` - 概要解説 (summaryNote): ${p.summaryNote}`);
    p.tickets.forEach((t, tIdx) => {
      const r = t.routeResult;
      const valid = t.validDays || (r && r.fareRules ? r.fareRules.validityDays : 1);
      const stopover = t.stopoverAllowed !== undefined ? t.stopoverAllowed : (r && r.fareRules ? r.fareRules.stopoverAllowed : false);
      const mars = r ? (r.marsString || r.marsFormat || '') : '';
      console.log(`   切符[${tIdx + 1}]: ${t.label} ￥${t.fare} [有効:${valid}日, 途中下車:${stopover}]`);
      console.log(`      マルス経由: ${mars}`);
      if (t.description) console.log(`      注記: ${t.description}`);
    });
  });
  return elapsed;
}

testMitakaRoundTrip(false);
testMitakaRoundTrip(true);

// -------------------------------------------------------------
// 検証2: 三鷹 → 銚子 単純片道 (visitIds: [], destId: 'choshi')
// -------------------------------------------------------------
console.log('\n-------------------------------------------------------------');
console.log('【検証2】三鷹 → 銚子 単純片道 (visitIds: [], destId: choshi)');
console.log('-------------------------------------------------------------');

function testMitakaChoshiOneWay(preferStopover) {
  console.log(`\n>>> [2] preferStopover: ${preferStopover}`);
  const t0 = Date.now();
  const res = OptimizerEngine.findCheapestTicketPlan('mitaka', [], {
    destId: 'choshi',
    returnToStart: false,
    preferStopover: preferStopover,
    fareType: 'adult',
    stations: stationsData,
    lines: linesData
  });
  const elapsed = Date.now() - t0;
  console.log(`実行時間: ${elapsed} ms`);
  console.log(`提案プラン数: ${res.plans.length}`);

  res.plans.slice(0, 2).forEach((p, idx) => {
    console.log(`\n第${idx + 1}案: ${p.title}`);
    console.log(` - 合計運賃: ￥${p.totalFare} (${p.diffFromBaseline >= 0 ? '+' : ''}${p.diffFromBaseline}円)`);
    console.log(` - 営業キロ: ${p.totalKm} km`);
    console.log(` - タグ: ${p.strategyTags.join(', ')}`);
    console.log(` - 概要解説 (summaryNote): ${p.summaryNote}`);
    p.tickets.forEach((t, tIdx) => {
      const r = t.routeResult;
      const valid = t.validDays || (r && r.fareRules ? r.fareRules.validityDays : 1);
      const stopover = t.stopoverAllowed !== undefined ? t.stopoverAllowed : (r && r.fareRules ? r.fareRules.stopoverAllowed : false);
      const mars = r ? (r.marsString || r.marsFormat || '') : '';
      console.log(`   切符[${tIdx + 1}]: ${t.label} ￥${t.fare} [有効:${valid}日, 途中下車:${stopover}]`);
      console.log(`      マルス経由: ${mars}`);
      if (t.description) console.log(`      注記: ${t.description}`);
    });
  });
  return elapsed;
}

testMitakaChoshiOneWay(false);
testMitakaChoshiOneWay(true);

// -------------------------------------------------------------
// 検証3: 既存主要ケースの速度＆回帰確認
// -------------------------------------------------------------
console.log('\n-------------------------------------------------------------');
console.log('【検証3】既存主要ケースの回帰確認');
console.log('-------------------------------------------------------------');

// 3-1: 東京 → 熱海（函南先買い ￥2,090）
console.log('\n>>> [3-1] 東京 → 熱海 (片道・途中下車希望・函南先買い)');
const tAtami = Date.now();
const resAtami = OptimizerEngine.findCheapestTicketPlan('tokyo', [], {
  destId: 'atami',
  returnToStart: false,
  preferStopover: true,
  fareType: 'adult',
  stations: stationsData,
  lines: linesData
});
const elAtami = Date.now() - tAtami;
console.log(`実行時間: ${elAtami} ms`);
const extPlan = resAtami.plans.find(p => p.tickets.some(t => t.extensionDropStation === '熱海'));
const shBypassPlan = resAtami.plans.find(p => p.strategyTags.some(tag => tag.includes('新幹線経由で近郊区間解除')));
console.log(` - 函南先買いプラン: ${extPlan ? `￥${extPlan.totalFare} (${extPlan.title}) [PASS]` : 'FAIL'}`);
console.log(` - 新幹線バイパスプラン: ${shBypassPlan ? `￥${shBypassPlan.totalFare} (${shBypassPlan.strategyTags[0]}) [PASS]` : 'FAIL'}`);

// 3-2: 東京発・['金沢', '京都'] 周遊（￥14,610）
console.log('\n>>> [3-2] 東京発・行きたい駅 [金沢, 京都] 周遊');
const tHokurikuLoop = Date.now();
const resHokurikuLoop = OptimizerEngine.findCheapestTicketPlan('tokyo', ['kanazawa', 'kyoto'], {
  returnToStart: true,
  preferStopover: true,
  fareType: 'adult',
  stations: stationsData,
  lines: linesData
});
const elHokurikuLoop = Date.now() - tHokurikuLoop;
console.log(`実行時間: ${elHokurikuLoop} ms`);
const bestHokuriku = resHokurikuLoop.plans[0];
console.log(` - 第1案: ￥${bestHokuriku.totalFare} (${bestHokuriku.title}) [${bestHokuriku.totalFare <= 14610 ? 'PASS' : 'FAIL'}]`);

// 3-3: 東京発・['京都'] 往復（草津⇄京都ヒゲ分離 ￥13,600）
console.log('\n>>> [3-3] 東京発・行きたい駅 [京都] 往復 (ヒゲ分離)');
const tKyoto = Date.now();
const resKyoto = OptimizerEngine.findCheapestTicketPlan('tokyo', ['kyoto'], {
  returnToStart: true,
  preferStopover: true,
  fareType: 'adult',
  stations: stationsData,
  lines: linesData
});
const elKyoto = Date.now() - tKyoto;
console.log(`実行時間: ${elKyoto} ms`);
const bestKyoto = resKyoto.plans[0];
console.log(` - 第1案: ￥${bestKyoto.totalFare} (${bestKyoto.title}) [${bestKyoto.totalFare === 13600 ? 'PASS' : 'FAIL'}]`);

// 3-4: 三鷹発・['成田', '銚子'] 片道（￥2,750・有効2日）
console.log('\n>>> [3-4] 三鷹発・行きたい駅 [成田]・着駅 銚子 (片道)');
const tNaritaChoshi = Date.now();
const resNaritaChoshi = OptimizerEngine.findCheapestTicketPlan('mitaka', ['narita'], {
  destId: 'choshi',
  returnToStart: false,
  preferStopover: true,
  fareType: 'adult',
  stations: stationsData,
  lines: linesData
});
const elNaritaChoshi = Date.now() - tNaritaChoshi;
console.log(`実行時間: ${elNaritaChoshi} ms`);
const bestNaritaChoshi = resNaritaChoshi.plans[0];
console.log(` - 第1案: ￥${bestNaritaChoshi.totalFare} (${bestNaritaChoshi.title}, ${bestNaritaChoshi.tickets[0].validDays}日) [PASS]`);

// 3-5: 大船 → 山手 → 東鷲宮 ＋ 新幹線 品川 → 東京（route-engine searchMarsRoute 回帰）
console.log('\n>>> [3-5] 大船 → 山手 → 東鷲宮 ＋ 新幹線 品川 → 東京');
const tShinkansenSeg = Date.now();
const resShinkansenSeg = RouteEngine.searchMarsRoute('ofuna', ['yamate'], 'higashi-washinomiya', {
  searchMode: 'oneway',
  shinkansenSegments: [{ fromId: 'shinagawa', toId: 'tokyo' }],
  forceShinkansenOnlyInSegments: true,
  stations: stationsData,
  lines: linesData
});
const elShinkansenSeg = Date.now() - tShinkansenSeg;
console.log(`実行時間: ${elShinkansenSeg} ms`);
console.log(` - 探索成功: ${resShinkansenSeg.success} [${resShinkansenSeg.success ? 'PASS' : 'FAIL'}]`);
console.log(` - マルス経由: ${resShinkansenSeg.marsString}`);
console.log(` - 運賃: ￥${resShinkansenSeg.fareRules ? resShinkansenSeg.fareRules.adultFare : 'N/A'}`);
console.log(` - 近郊区間解除: ${resShinkansenSeg.fareRules ? !resShinkansenSeg.fareRules.isSuburbanOnly : 'N/A'} (途中下車:${resShinkansenSeg.fareRules ? resShinkansenSeg.fareRules.stopoverAllowed : 'N/A'})`);
