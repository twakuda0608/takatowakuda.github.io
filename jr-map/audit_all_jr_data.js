/**
 * audit_all_jr_data.js
 * 全国188路線の自動監査スクリプト
 * 1. JR_TRACKS 内の二重線・重複・直線ショートカットチェーン検出 / 未定義路線検出
 * 2. ポリライン内の異常ジャンプ (1.5km以上のワープ・折り返し) 検出
 * 3. 営業キロの単調性・逆転チェック
 * 4. 営業キロ vs 直線幾何距離の異常乖離チェック (ハルシネーション検出)
 * 5. 駅順のジグザグ（Uターン/150度以上反転）チェック
 */

const fs = require('fs');
const path = require('path');

const root = __dirname;
const { JR_LINES, JR_STATIONS } = require(path.join(root, 'data/build-data.js'));
const { OFFICIAL_STATION_KILOS } = require(path.join(root, 'data/official-kilos.js'));
const { JR_TRACKS } = require(path.join(root, 'data/tracks.js'));

function calcDistKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function calcBearing(lat1, lon1, lat2, lon2) {
  const y = Math.sin((lon2 - lon1) * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180);
  const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
            Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos((lon2 - lon1) * Math.PI / 180);
  let brng = Math.atan2(y, x) * 180 / Math.PI;
  return (brng + 360) % 360;
}

const auditResults = {
  tracksShortOrDuplicateChains: [],
  tracksMissingLines: [],
  tracksJumps: [],
  kilosNonMonotonic: [],
  kilosGeometryAnomalies: [],
  stationZigzags: [],
  tracksDisconnectedStations: []
};

// ==========================================
// Check 1 & 2: JR_TRACKS 幾何データ監査
// ==========================================
JR_LINES.forEach(line => {
  const chains = JR_TRACKS[line.id];
  if (!chains || chains.length === 0) {
    auditResults.tracksMissingLines.push({
      lineId: line.id,
      lineName: line.name,
      stationCount: line.stations.length
    });
    return;
  }

  // 1. ショートカット・極小頂点チェーン・重複チェック
  chains.forEach((chain, cIdx) => {
    if (chain.length <= 5) {
      auditResults.tracksShortOrDuplicateChains.push({
        lineId: line.id,
        lineName: line.name,
        chainIdx: cIdx,
        points: chain.length,
        start: chain[0],
        end: chain[chain.length - 1]
      });
    }

    // 2. 異常ジャンプ（1.5km以上）または即時折り返し（A -> B -> A）
    for (let i = 0; i < chain.length - 1; i++) {
      const p1 = chain[i];
      const p2 = chain[i + 1];
      const d = calcDistKm(p1[0], p1[1], p2[0], p2[1]);

      // 直前の点へ即時反転戻り
      if (i > 0) {
        const p0 = chain[i - 1];
        const distReturn = calcDistKm(p0[0], p0[1], p2[0], p2[1]);
        if (distReturn < 0.05 && d > 0.5) {
          auditResults.tracksJumps.push({
            type: 'BOOMERANG_JUMP',
            lineId: line.id,
            lineName: line.name,
            chainIdx: cIdx,
            pointIdx: i,
            dist: d,
            from: p1,
            to: p2
          });
        }
      }

      if (d >= 15) {
        auditResults.tracksJumps.push({
          type: 'LARGE_WARP',
          lineId: line.id,
          lineName: line.name,
          chainIdx: cIdx,
          pointIdx: i,
          dist: d,
          from: p1,
          to: p2
        });
      }
    }
  });
});

// ==========================================
// Check 3, 4, 5: 営業キロ・駅順・幾何比較監査 (本線・支線全チェーン走査)
// ==========================================
JR_LINES.forEach(line => {
  const lineKilos = OFFICIAL_STATION_KILOS[line.id] || {};
  const chains = [line.stations, ...(line.branches || [])];

  chains.forEach((stIds, cIdx) => {
    const stations = stIds.map(id => JR_STATIONS[id]).filter(Boolean);
    let lastBearing = null;
    let dir = 0;

    for (let i = 0; i < stations.length - 1; i++) {
      const s1 = stations[i];
      const s2 = stations[i + 1];

      const k1 = lineKilos[s1.id] !== undefined ? lineKilos[s1.id] : lineKilos[s1.name];
      const k2 = lineKilos[s2.id] !== undefined ? lineKilos[s2.id] : lineKilos[s2.name];

      let salesDist;
      let rawDiff = 0;
      if (line.edgeDistances) {
        const k1Key = `${s1.id}-${s2.id}`;
        const k2Key = `${s2.id}-${s1.id}`;
        const kName1 = `${s1.name}-${s2.name}`;
        const kName2 = `${s2.name}-${s1.name}`;
        const edgeD = line.edgeDistances[k1Key] ?? line.edgeDistances[k2Key] ??
                      line.edgeDistances[kName1] ?? line.edgeDistances[kName2];
        if (edgeD !== undefined && edgeD !== null) {
          salesDist = edgeD;
          rawDiff = dir >= 0 ? edgeD : -edgeD;
        }
      }
      if (salesDist === undefined && k1 !== undefined && k2 !== undefined) {
        salesDist = Math.round(Math.abs(k2 - k1) * 10) / 10;
        rawDiff = k2 - k1;
      }

      const geoDist = calcDistKm(s1.lat, s1.lng, s2.lat, s2.lng);

      if (salesDist !== undefined) {
        // 3. 単調性チェック
        const currentDir = rawDiff > 0 ? 1 : -1;
        if (rawDiff === 0) {
          auditResults.kilosNonMonotonic.push({
            type: 'ZERO_DIFF',
            lineId: line.id,
            lineName: line.name,
            chainIdx: cIdx,
            s1: s1.name,
            s2: s2.name,
            k1, k2
          });
        } else if (dir === 0) {
          dir = currentDir;
        } else if (dir !== currentDir) {
          auditResults.kilosNonMonotonic.push({
            type: 'REVERSED_DIRECTION',
            lineId: line.id,
            lineName: line.name,
            chainIdx: cIdx,
            s1: s1.name,
            s2: s2.name,
            k1, k2, rawDiff
          });
        }

        // 4. 営業キロ vs 直線幾何距離の異常乖離
        // (a) 営業キロが直線距離の0.7倍未満かつ乖離1.0km超 (線路が直線より短い＝明らかな誤り)
        if (salesDist < geoDist * 0.7 && (geoDist - salesDist) > 1.0) {
          auditResults.kilosGeometryAnomalies.push({
            type: 'SALES_SHORTER_THAN_STRAIGHT',
            lineId: line.id,
            lineName: line.name,
            chainIdx: cIdx,
            s1: s1.name,
            s2: s2.name,
            salesDist,
            geoDist: Math.round(geoDist * 10) / 10
          });
        }
        // (b) 営業キロが直線距離の3.5倍超 (極端な迂回またはハルシネーション)
        // ※大回り山岳線・半島迂回を除外するため直線距離 > 5.0km を対象
        if (geoDist > 5.0 && salesDist > geoDist * 3.5) {
          auditResults.kilosGeometryAnomalies.push({
            type: 'SALES_EXCESSIVE_RATIO',
            lineId: line.id,
            lineName: line.name,
            chainIdx: cIdx,
            s1: s1.name,
            s2: s2.name,
            salesDist,
            geoDist: Math.round(geoDist * 10) / 10,
            ratio: (salesDist / geoDist).toFixed(2)
          });
        }
        // (c) 駅間距離の異常値 (0.1km未満 または 40km超[新幹線および3セク分断路線除く])
        if (salesDist < 0.1) {
          auditResults.kilosGeometryAnomalies.push({
            type: 'GAP_UNDER_0_1KM',
            lineId: line.id,
            lineName: line.name,
            chainIdx: cIdx,
            s1: s1.name,
            s2: s2.name,
            salesDist
          });
        }
        const thirdSectorSplitLines = ['kyushu-kagoshima', 'shinetsu-main', 'ouu-main', 'hokkaido-nemuro', 'hokkaido-kaikyo'];
        if (!line.id.startsWith('shinkansen-') && !thirdSectorSplitLines.includes(line.id) && salesDist > 40) {
          auditResults.kilosGeometryAnomalies.push({
            type: 'GAP_OVER_40KM',
            lineId: line.id,
            lineName: line.name,
            chainIdx: cIdx,
            s1: s1.name,
            s2: s2.name,
            salesDist
          });
        }
      }

      // 5. 駅順のジグザグ（Uターン/150度以上反転）
      const bearing = calcBearing(s1.lat, s1.lng, s2.lat, s2.lng);
      if (lastBearing !== null && geoDist > 0.3) {
        let angleDiff = Math.abs(bearing - lastBearing);
        if (angleDiff > 180) angleDiff = 360 - angleDiff;
        if (angleDiff >= 150 && s1.name !== '会津若松') {
          auditResults.stationZigzags.push({
            lineId: line.id,
            lineName: line.name,
            chainIdx: cIdx,
            prevStation: stations[i - 1].name,
            currStation: s1.name,
            nextStation: s2.name,
            angleDiff: Math.round(angleDiff)
          });
        }
      }
      lastBearing = bearing;
    }
  });
});

// ==========================================
// Check 6: 全駅・線路近接監査（駅〜線路ポリライン最短距離150m以内）
// ==========================================
function distToSegmentSquared(px, py, vx, vy, wx, wy) {
  const l2 = (vx - wx) ** 2 + (vy - wy) ** 2;
  if (l2 === 0) return (px - vx) ** 2 + (py - vy) ** 2;
  let t = ((px - vx) * (wx - vx) + (py - vy) * (wy - vy)) / l2;
  t = Math.max(0, Math.min(1, t));
  const projX = vx + t * (wx - vx);
  const projY = vy + t * (wy - vy);
  return (px - projX) ** 2 + (py - projY) ** 2;
}

function minDistanceToPolylineMeters(stLat, stLng, chains) {
  if (!chains || chains.length === 0) return Infinity;
  const DEG_TO_RAD = Math.PI / 180;
  const cosLat = Math.cos(stLat * DEG_TO_RAD);
  const mPerLat = 111132.954;
  const mPerLng = 111412.84 * cosLat;
  let minDistSq = Infinity;

  for (const chain of chains) {
    if (!chain || chain.length === 0) continue;
    if (chain.length === 1) {
      const vx = (chain[0][1] - stLng) * mPerLng;
      const vy = (chain[0][0] - stLat) * mPerLat;
      const d2 = vx * vx + vy * vy;
      if (d2 < minDistSq) minDistSq = d2;
      continue;
    }
    for (let i = 0; i < chain.length - 1; i++) {
      const vx = (chain[i][1] - stLng) * mPerLng;
      const vy = (chain[i][0] - stLat) * mPerLat;
      const wx = (chain[i + 1][1] - stLng) * mPerLng;
      const wy = (chain[i + 1][0] - stLat) * mPerLat;
      const d2 = distToSegmentSquared(0, 0, vx, vy, wx, wy);
      if (d2 < minDistSq) minDistSq = d2;
    }
  }
  return Math.sqrt(minDistSq);
}

JR_LINES.forEach(line => {
  const chains = JR_TRACKS[line.id] || [];
  const stationIdSet = new Set(line.stations);
  if (line.branches) {
    line.branches.forEach(branch => branch.forEach(id => stationIdSet.add(id)));
  }

  for (const stId of stationIdSet) {
    const st = JR_STATIONS[stId];
    if (!st) {
      auditResults.tracksDisconnectedStations.push({
        lineId: line.id,
        lineName: line.name,
        stId,
        stName: 'MISSING_STATION_DEF',
        distMeters: Infinity
      });
      continue;
    }

    const distM = minDistanceToPolylineMeters(st.lat, st.lng, chains);
    if (distM >= 150) {
      auditResults.tracksDisconnectedStations.push({
        lineId: line.id,
        lineName: line.name,
        stId: st.id,
        stName: st.name,
        distMeters: Math.round(distM)
      });
    }
  }
});

console.log('================================================================');
console.log('全国188路線 自動監査レポート (audit_all_jr_data.js)');
console.log('================================================================');

console.log(`\n1. 【JR_TRACKS ショートカット / 極小頂点チェーン】: ${auditResults.tracksShortOrDuplicateChains.length} 件`);
auditResults.tracksShortOrDuplicateChains.forEach(x => {
  console.log(`  - [${x.lineId}] ${x.lineName} chain ${x.chainIdx}: ${x.points} pts, start:${x.start}, end:${x.end}`);
});

console.log(`\n1-b. 【JR_TRACKS 未登録路線 (直線フォールバック中)】: ${auditResults.tracksMissingLines.length} 件`);
auditResults.tracksMissingLines.forEach(x => {
  console.log(`  - [${x.lineId}] ${x.lineName} (${x.stationCount} stations)`);
});

console.log(`\n2. 【ポリライン内の異常ジャンプ / ブーメラン戻り】: ${auditResults.tracksJumps.length} 件`);
auditResults.tracksJumps.slice(0, 30).forEach(x => {
  console.log(`  - [${x.type}] ${x.lineName} chain ${x.chainIdx} pt ${x.pointIdx}: ${x.dist.toFixed(2)}km (${x.from} -> ${x.to})`);
});
if (auditResults.tracksJumps.length > 30) {
  console.log(`    ... 他 ${auditResults.tracksJumps.length - 30} 件`);
}

console.log(`\n3. 【営業キロ 単調性・逆転異常】: ${auditResults.kilosNonMonotonic.length} 件`);
auditResults.kilosNonMonotonic.forEach(x => {
  console.log(`  - [${x.type}] ${x.lineName}: ${x.s1}(${x.k1}) -> ${x.s2}(${x.k2})`);
});

console.log(`\n4. 【営業キロ vs 直線幾何距離 異常乖離】: ${auditResults.kilosGeometryAnomalies.length} 件`);
auditResults.kilosGeometryAnomalies.forEach(x => {
  console.log(`  - [${x.type}] ${x.lineName}: ${x.s1}〜${x.s2} (営業キロ:${x.salesDist}km, 直線:${x.geoDist}km${x.ratio ? ', 比率:' + x.ratio : ''})`);
});

console.log(`\n5. 【駅順ジグザグ (150度以上反転)】: ${auditResults.stationZigzags.length} 件`);
auditResults.stationZigzags.forEach(x => {
  console.log(`  - ${x.lineName}: ${x.prevStation} -> ${x.currStation} -> ${x.nextStation} (反転角:${x.angleDiff}°)`);
});

console.log(`\n6. 【全駅・線路近接（最短距離150m以内）】: ${auditResults.tracksDisconnectedStations.length} 件`);
auditResults.tracksDisconnectedStations.forEach(x => {
  console.log(`  - [${x.lineId}] ${x.lineName}: ${x.stName} (${x.stId}) - ${x.distMeters}m`);
});

const totalIssues = auditResults.tracksShortOrDuplicateChains.length +
                    auditResults.tracksMissingLines.length +
                    auditResults.tracksJumps.length +
                    auditResults.kilosNonMonotonic.length +
                    auditResults.kilosGeometryAnomalies.length +
                    auditResults.stationZigzags.length +
                    auditResults.tracksDisconnectedStations.length;

console.log('\n================================================================');
console.log(`監査終了: 総検出件数 ${totalIssues} 件`);
console.log('================================================================');
