/**
 * JR Cheapest Ticket Optimizer Engine
 * 最安乗車券プラン最適化エンジン
 * 途中下車・一筆書き・分岐駅別途往復・101km超え/近郊区間脱出の先買い・最適分割購入を組み合わせた最安買い方の自動提案
 */
(function() {
  let RouteEngine = null;
  let FareEngine = null;

  function initDependencies() {
    if (typeof window !== 'undefined') {
      RouteEngine = window.JR_ROUTE_ENGINE;
      FareEngine = window.JR_FARE_ENGINE;
    }
    if (!RouteEngine && typeof require !== 'undefined') {
      try {
        RouteEngine = require('./route-engine.js');
      } catch (e) {}
    }
    if (!FareEngine && typeof require !== 'undefined') {
      try {
        FareEngine = require('./fare-engine.js');
      } catch (e) {}
    }
  }

  // 主要会社境界駅（長距離分割購入のチェック対象）
  const COMPANY_BORDER_STATION_NAMES = new Set([
    '熱海', '米原', '新下関', '上越妙高', '児島', '塩尻', '亀山', '猪谷', '南小谷', '新青森'
  ]);

  // 新幹線1区間組み込み（大都市近郊区間解除）の候補ペアリスト
  const SUBURBAN_BYPASS_SHINKANSEN_PAIRS = [
    // 東京近郊 (東北・上越・東海道新幹線)
    { fromId: 'tokyo', toId: 'ueno', name: '東京〜上野' },
    { fromId: 'ueno', toId: 'tokyo', name: '上野〜東京' },
    { fromId: 'shinagawa', toId: 'tokyo', name: '品川〜東京' },
    { fromId: 'tokyo', toId: 'shinagawa', name: '東京〜品川' },
    { fromId: 'ueno', toId: 'omiya', name: '上野〜大宮' },
    { fromId: 'omiya', toId: 'ueno', name: '大宮〜上野' },
    { fromId: 'tokyo', toId: 'omiya', name: '東京〜大宮' },
    { fromId: 'omiya', toId: 'tokyo', name: '大宮〜東京' },
    { fromId: 'shinagawa', toId: 'shin-yokohama', name: '品川〜新横浜' },
    { fromId: 'shin-yokohama', toId: 'shinagawa', name: '新横浜〜品川' },
    { fromId: 'tokyo', toId: 'shin-yokohama', name: '東京〜新横浜' },
    { fromId: 'shin-yokohama', toId: 'tokyo', name: '新横浜〜東京' },
    // 近畿圏 (大阪近郊)
    { fromId: 'shin-osaka', toId: 'kyoto', name: '新大阪〜京都' },
    { fromId: 'kyoto', toId: 'shin-osaka', name: '京都〜新大阪' },
    { fromId: 'shin-osaka', toId: 'shin-kobe', name: '新大阪〜新神戸' },
    { fromId: 'shin-kobe', toId: 'shin-osaka', name: '新神戸〜新大阪' },
    // 福岡近郊 (山陽新幹線)
    { fromId: 'kokura', toId: 'hakata', name: '小倉〜博多' },
    { fromId: 'hakata', toId: 'kokura', name: '博多〜小倉' },
    // 仙台近郊
    { fromId: 'sendai', toId: 'shiroishizao', name: '仙台〜白石蔵王' },
    { fromId: 'shiroishizao', toId: 'sendai', name: '白石蔵王〜仙台' },
    // 新潟近郊
    { fromId: 'niigata', toId: 'tsubamesanjo', name: '新潟〜燕三条' },
    { fromId: 'tsubamesanjo', toId: 'niigata', name: '燕三条〜新潟' }
  ];

  // 2駅間の直線距離（km）計算
  function calcDistKm(st1, st2) {
    if (!st1 || !st2 || typeof st1.lat !== 'number' || typeof st2.lat !== 'number') return 9999;
    const dLat = (st1.lat - st2.lat) * 111.13;
    const dLng = (st1.lng - st2.lng) * 91.0;
    return Math.sqrt(dLat * dLat + dLng * dLng);
  }

  // 2026年3月14日改定: 東海道新幹線（東京〜熱海間）および山陽新幹線（新下関〜博多間）は並行在来線と完全別線
  const TOKAIDO_SHINKANSEN_SEPARATE_SET = new Set(['tokyo', 'shinagawa', 'shin-yokohama', 'odawara', 'atami']);
  const SANYO_SHINKANSEN_SEPARATE_SET = new Set(['shin-shimonoseki', 'kokura', 'hakata']);

  /**
   * 新幹線バイパス区間が完全別線（並行在来線代用不可・要特急券）か判定
   * - 東海道新幹線（東京〜熱海間）
   * - 山陽新幹線（新下関〜博多間）
   */
  function isSeparateShinkansenBypassPair(fromId, toId) {
    if (!fromId || !toId) return false;
    if (TOKAIDO_SHINKANSEN_SEPARATE_SET.has(fromId) && TOKAIDO_SHINKANSEN_SEPARATE_SET.has(toId)) {
      return true;
    }
    if (SANYO_SHINKANSEN_SEPARATE_SET.has(fromId) && SANYO_SHINKANSEN_SEPARATE_SET.has(toId)) {
      return true;
    }
    return false;
  }

  /**
   * 新幹線バイパス区間の解説文・タグ・チケット注記を生成
   */
  function getShinkansenBypassDetails(fromId, toId, pairName, validDays, stations) {
    const isSeparate = isSeparateShinkansenBypassPair(fromId, toId);
    const fromName = (stations && stations[fromId] && stations[fromId].name) || fromId;
    const toName = (stations && stations[toId] && stations[toId].name) || toId;
    const pName = pairName || `${fromName}〜${toName}`;

    if (isSeparate) {
      return {
        isSeparate: true,
        tag: `新幹線経由で近郊区間解除（${pName}・要特急券）`,
        description: `${pName}新幹線経由（完全別線・新幹線乗車および別途特急券が必要）`,
        summaryNote: `${fromName} → ${toName} の1区間を新幹線経由にすることで大都市近郊区間の特例が外れ、途中下車可能（有効${validDays}日間）になります。※この区間は並行在来線と完全別線扱いのため、並行在来線での代用はできず、実際に新幹線へ乗車（別途特急券が必要）する必要があります。`
      };
    } else {
      return {
        isSeparate: false,
        tag: `新幹線経由で近郊区間解除（${pName}・在来線乗車可）`,
        description: `${pName}新幹線経由で発券（並行在来線乗車可・特急券不要）`,
        summaryNote: `${fromName} → ${toName} の1区間を新幹線経由で発券することで大都市近郊区間の特例が外れ、途中下車可能（有効${validDays}日間）になります。この区間は並行在来線と同一線扱いのため、実際に新幹線に乗らず並行在来線で移動しても問題ありません（特急券不要）。新幹線に乗車する場合のみ別途特急券が必要です。`
      };
    }
  }

  /**
   * 運賃種別に応じた適用金額の取得
   */
  function getTicketPrice(fareRules, fareType = 'adult') {
    if (!fareRules || fareRules.isAvailable === false) return Infinity;
    if (fareType === 'child') {
      return (typeof fareRules.childFare === 'number') ? fareRules.childFare : Infinity;
    }
    if (fareType === 'student') {
      if (fareRules.isStudentEligible && typeof fareRules.studentFare === 'number') {
        return fareRules.studentFare;
      }
      return (typeof fareRules.adultFare === 'number') ? fareRules.adultFare : Infinity;
    }
    return (typeof fareRules.adultFare === 'number') ? fareRules.adultFare : Infinity;
  }

  /**
   * ある乗車券で stopIds 全駅に途中下車できるかの厳密判定
   */
  function canStopoverAll(routeResult, stopIds, stations) {
    if (!routeResult || !routeResult.success || !routeResult.fareRules) return false;
    if (routeResult.fareRules.stopoverAllowed !== true) return false;
    if (!stopIds || stopIds.length === 0) return true;

    const fareRules = routeResult.fareRules;
    const deptZoneApplied = fareRules.deptZoneApplied;
    const destZoneApplied = fareRules.destZoneApplied;
    const deptZone = fareRules.deptZone;
    const destZone = fareRules.destZone;

    if (!deptZoneApplied && !destZoneApplied) return true;

    for (const stId of stopIds) {
      if (stId === routeResult.deptId || stId === routeResult.destId) continue;
      const st = stations[stId];
      const stName = st ? st.name : stId;

      if (deptZoneApplied && deptZone && FareEngine && FareEngine.isStationInZone) {
        if (FareEngine.isStationInZone(stId, stName, deptZone, stations)) {
          return false;
        }
      }
      if (destZoneApplied && destZone && FareEngine && FareEngine.isStationInZone) {
        if (FareEngine.isStationInZone(stId, stName, destZone, stations)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * 訪問駅の近隣ジャンクション（接続・分岐駅）探索
   * 次数3以上または複数路線所属で、maxKm(45km)・maxHops(12)以内の駅を近い順に最大3駅返す
   */
  function findNearbyJunctions(graph, startId, stations, lines, maxHops = 12, maxKm = 45) {
    if (!graph || !stations || !stations[startId]) return [];
    const junctions = [];
    const visited = new Map();
    const queue = [{ id: startId, km: 0, hops: 0 }];
    visited.set(startId, 0);

    while (queue.length > 0) {
      queue.sort((a, b) => a.km - b.km);
      const curr = queue.shift();

      if (curr.id !== startId) {
        const st = stations[curr.id];
        if (st) {
          const neighbors = graph.get(curr.id) || [];
          const distinctLines = new Set(neighbors.map(e => e.lineId));
          // 次数3以上、または複数路線（新幹線以外を含む）
          if (neighbors.length >= 3 || distinctLines.size >= 2) {
            junctions.push({
              id: curr.id,
              name: st.name,
              km: Math.round(curr.km * 10) / 10,
              hops: curr.hops
            });
            if (junctions.length >= 3) break;
          }
        }
      }

      if (curr.hops >= maxHops || curr.km >= maxKm) continue;

      const edges = graph.get(curr.id) || [];
      for (const edge of edges) {
        const nextId = edge.to;
        const nextKm = curr.km + edge.dist;
        if (nextKm > maxKm) continue;
        if (!visited.has(nextId) || visited.get(nextId) > nextKm) {
          visited.set(nextId, nextKm);
          queue.push({ id: nextId, km: nextKm, hops: curr.hops + 1 });
        }
      }
    }

    return junctions;
  }

  /**
   * 101km超え・大都市近郊区間脱出の延長先探索
   */
  function findExtensionTargets(graph, deptId, midStops, endId, stations, lines, options, cachedSearchFn, baseRoute) {
    if (!graph || !stations || !stations[endId]) return [];
    const extTargets = [];
    const visited = new Set();
    const queue = [{ id: endId, km: 0, hops: 0 }];
    visited.add(endId);

    // 既に通過した全駅およびエッジは探索しない（後戻り防止）
    const basePassed = new Set((baseRoute && baseRoute.allStationIds) ? baseRoute.allStationIds : [deptId, ...midStops, endId]);

    while (queue.length > 0 && extTargets.length < 3) {
      queue.sort((a, b) => a.km - b.km);
      const curr = queue.shift();

      if (curr.id !== endId) {
        const candId = curr.id;
        const candSt = stations[candId];
        if (candSt) {
          // 延長ルートを試行
          const testRes = cachedSearchFn(deptId, [...midStops, endId], candId, {
            searchMode: 'oneway',
            useShinkansen: options.useShinkansen
          });

          if (testRes && testRes.success && testRes.isOneWayTrip && testRes.fareRules) {
            if (testRes.fareRules.stopoverAllowed === true) {
              if (canStopoverAll(testRes, [...midStops, endId], stations)) {
                extTargets.push({
                  id: candId,
                  name: candSt.name,
                  routeResult: testRes,
                  km: testRes.totalKm
                });
                // 1駅先（最近傍の候補）で途中下車可能が成立した場合は過度な遠回り防止のため探索打ち切り
                break;
              }
            }
          }
        }
      }

      if (curr.hops >= 12 || curr.km >= 60) continue;

      const edges = graph.get(curr.id) || [];
      for (const edge of edges) {
        if (!options.useShinkansen && (edge.isShinkansen || (edge.lineId && edge.lineId.startsWith('shinkansen-')))) continue;
        if (basePassed.has(edge.to) && edge.to !== endId) continue;
        if (!visited.has(edge.to)) {
          visited.add(edge.to);
          queue.push({ id: edge.to, km: curr.km + edge.dist, hops: curr.hops + 1 });
        }
      }
    }

    return extTargets;
  }

  /**
   * 現実的な途中下車アップグレード判定
   * 通常最安（baselineFare）の +35% 以内、または +￥1,500 以内であれば優先昇格対象
   * （完全別線新幹線バイパス等の特急券込み実質運賃 effectiveFare に基づいて判定）
   */
  function isReasonableStopoverUpgrade(plan, baselineFare) {
    if (!plan || !plan.isStopoverFriendly) return false;
    const maxAllowedFare = Math.max(baselineFare * 1.35, baselineFare + 1500);
    const costToEvaluate = (plan.effectiveFare !== undefined) ? plan.effectiveFare : plan.totalFare;
    return costToEvaluate <= maxAllowedFare;
  }

  /**
   * 新幹線1区間組み込みによる大都市近郊区間解除の候補探索（上位最大2件を返却）
   */
  function findSuburbanBypassesWithShinkansen(deptId, midStops, destId, baseRoute, stations, cachedSearchFn, options = {}) {
    if (!baseRoute || !baseRoute.success || !baseRoute.fareRules) return [];
    if (baseRoute.fareRules.isSuburbanOnly !== true) return [];
    if (baseRoute.totalKm < 90) return []; // 100km超えまたはその境界付近のみ対象

    // タイムアウト安全チェック
    if (options.checkTimeBudget && options.checkTimeBudget()) return [];

    const allNodes = baseRoute.allStationIds || [];
    const nodeIndexMap = new Map();
    allNodes.forEach((id, idx) => {
      if (!nodeIndexMap.has(id)) nodeIndexMap.set(id, idx);
    });

    // 1. エリア自動判定: baseRoute 上の駅の緯度経度・駅IDから関係エリアを判定
    const hasTokyoArea = allNodes.some(id => {
      const st = stations[id];
      if (!st) return false;
      return (st.lat >= 34.8 && st.lat <= 36.8 && st.lng >= 138.5 && st.lng <= 141.2);
    }) || allNodes.some(id => ['tokyo', 'shinagawa', 'ueno', 'omiya', 'chiba', 'mitaka', 'narita', 'choshi', 'yokohama', 'odawara', 'atami'].includes(id));

    const hasKansaiArea = allNodes.some(id => {
      const st = stations[id];
      if (!st) return false;
      return (st.lat >= 34.0 && st.lat <= 35.6 && st.lng >= 134.5 && st.lng <= 136.5);
    }) || allNodes.some(id => ['shin-osaka', 'osaka', 'kyoto', 'shin-kobe', 'sannomiya', 'tennoji'].includes(id));

    const hasKyushuArea = allNodes.some(id => {
      const st = stations[id];
      if (!st) return false;
      return (st.lat >= 31.0 && st.lat <= 34.2 && st.lng >= 129.5 && st.lng <= 132.0);
    }) || allNodes.some(id => ['kokura', 'hakata', 'tosu', 'kurume'].includes(id));

    const hasSendaiArea = allNodes.some(id => {
      const st = stations[id];
      if (!st) return false;
      return (st.lat >= 37.5 && st.lat <= 39.0 && st.lng >= 140.0 && st.lng <= 141.5);
    }) || allNodes.some(id => ['sendai', 'shiroishizao', 'fukushima', 'koriyama'].includes(id));

    const hasNiigataArea = allNodes.some(id => {
      const st = stations[id];
      if (!st) return false;
      return (st.lat >= 37.0 && st.lat <= 38.5 && st.lng >= 138.5 && st.lng <= 139.5);
    }) || allNodes.some(id => ['niigata', 'tsubamesanjo', 'nagaoka'].includes(id));

    const maxLegCost = Math.max(baseRoute.totalKm * 2.2, 250);
    const baseFare = getTicketPrice(baseRoute.fareRules, options.fareType || 'adult');
    const isIdealBypass = (b) => Number.isFinite(baseFare) && b.fare <= baseFare && b.routeResult.totalKm <= baseRoute.totalKm * 1.15 && !b.isSeparate && b.isSingleCompany;

    const bypassCandidates = [];

    // パターン1: 既存ルートの通過駅に新幹線ペアが含まれている場合
    for (const pair of SUBURBAN_BYPASS_SHINKANSEN_PAIRS) {
      if (options.checkTimeBudget && options.checkTimeBudget()) break;

      // エリア外スキップ
      if (['kokura', 'hakata'].includes(pair.fromId) && !hasKyushuArea) continue;
      if (['shin-osaka', 'kyoto', 'shin-kobe'].includes(pair.fromId) && !hasKansaiArea) continue;
      if (['sendai', 'shiroishizao'].includes(pair.fromId) && !hasSendaiArea) continue;
      if (['niigata', 'tsubamesanjo'].includes(pair.fromId) && !hasNiigataArea) continue;
      if (['tokyo', 'ueno', 'shinagawa', 'omiya', 'shin-yokohama'].includes(pair.fromId) && !hasTokyoArea) continue;

      if (nodeIndexMap.has(pair.fromId) && nodeIndexMap.has(pair.toId)) {
        const idxFrom = nodeIndexMap.get(pair.fromId);
        const idxTo = nodeIndexMap.get(pair.toId);
        if (idxFrom < idxTo) {
          const bypassRes = cachedSearchFn(deptId, midStops, destId, {
            searchMode: 'oneway',
            useShinkansen: true,
            shinkansenSegments: [{ fromId: pair.fromId, toId: pair.toId }],
            forceShinkansenOnlyInSegments: true,
            maxBacktrackAttempts: 2,
            maxLegCost: maxLegCost
          });

          if (bypassRes && bypassRes.success && bypassRes.isOneWayTrip && bypassRes.fareRules) {
            // 大迂回除外ガード: baseRoute.totalKm の 2.2倍を超える極端な大回りルートは除外
            if (bypassRes.totalKm > baseRoute.totalKm * 2.2) continue;

            if (bypassRes.fareRules.isSuburbanOnly === false && bypassRes.fareRules.stopoverAllowed === true) {
              if (canStopoverAll(bypassRes, midStops, stations)) {
                const fare = getTicketPrice(bypassRes.fareRules, options.fareType || 'adult');
                const isSep = isSeparateShinkansenBypassPair(pair.fromId, pair.toId);
                const isSingleCo = !bypassRes.fareRules.isInterCompany;
                bypassRes.shinkansenSegments = [{ fromId: pair.fromId, toId: pair.toId }];
                bypassRes.forceShinkansenOnlyInSegments = true;
                bypassRes.viaIds = midStops;
                const candidateObj = {
                  pair,
                  routeResult: bypassRes,
                  fare: fare,
                  isSingleCompany: isSingleCo,
                  isSeparate: isSep
                };
                bypassCandidates.push(candidateObj);

                // 早期リターン（理想的なバイパス）
                if (isIdealBypass(candidateObj)) {
                  break;
                }
              }
            }
          }
        }
      }
    }

    // 理想的なバイパスが見つかった場合は早期終了
    if (bypassCandidates.some(isIdealBypass)) {
      return bypassCandidates.slice(0, 2);
    }

    // パターン2: ルート上に新幹線駅が含まれていない場合、主要新幹線ペア（および回避補助中継駅）を経由駅に挿入して試行
    const insertCandidatePatterns = [];

    if (hasTokyoArea) {
      insertCandidatePatterns.push(
        { fromId: 'tokyo', toId: 'ueno', name: '東京〜上野', insertVias: ['tokyo', 'ueno'] },
        { fromId: 'ueno', toId: 'tokyo', name: '上野〜東京', insertVias: ['ueno', 'tokyo'] },
        { fromId: 'ueno', toId: 'tokyo', name: '上野〜東京（東北新幹線）', insertVias: ['nippori', 'ueno', 'tokyo'] },
        { fromId: 'tokyo', toId: 'ueno', name: '東京〜上野（東北新幹線）', insertVias: ['shinagawa', 'tokyo', 'ueno'] },
        { fromId: 'shinagawa', toId: 'tokyo', name: '品川〜東京', insertVias: ['shinagawa', 'tokyo'] },
        { fromId: 'tokyo', toId: 'shinagawa', name: '東京〜品川', insertVias: ['tokyo', 'shinagawa'] },
        { fromId: 'ueno', toId: 'omiya', name: '上野〜大宮', insertVias: ['ueno', 'omiya'] },
        { fromId: 'omiya', toId: 'ueno', name: '大宮〜上野', insertVias: ['omiya', 'ueno'] },
        { fromId: 'shinagawa', toId: 'shin-yokohama', name: '品川〜新横浜', insertVias: ['shinagawa', 'shin-yokohama'] },
        { fromId: 'shin-yokohama', toId: 'shinagawa', name: '新横浜〜品川', insertVias: ['shin-yokohama', 'shinagawa'] },
        { fromId: 'tokyo', toId: 'shin-yokohama', name: '東京〜新横浜', insertVias: ['tokyo', 'shin-yokohama'] },
        { fromId: 'shin-yokohama', toId: 'tokyo', name: '新横浜〜東京', insertVias: ['shin-yokohama', 'tokyo'] }
      );
    }
    if (hasKansaiArea) {
      insertCandidatePatterns.push(
        { fromId: 'shin-osaka', toId: 'kyoto', name: '新大阪〜京都', insertVias: ['shin-osaka', 'kyoto'] },
        { fromId: 'kyoto', toId: 'shin-osaka', name: '京都〜新大阪', insertVias: ['kyoto', 'shin-osaka'] },
        { fromId: 'shin-osaka', toId: 'shin-kobe', name: '新大阪〜新神戸', insertVias: ['shin-osaka', 'shin-kobe'] },
        { fromId: 'shin-kobe', toId: 'shin-osaka', name: '新神戸〜新大阪', insertVias: ['shin-kobe', 'shin-osaka'] }
      );
    }
    if (hasKyushuArea) {
      insertCandidatePatterns.push(
        { fromId: 'kokura', toId: 'hakata', name: '小倉〜博多', insertVias: ['kokura', 'hakata'] },
        { fromId: 'hakata', toId: 'kokura', name: '博多〜小倉', insertVias: ['hakata', 'kokura'] }
      );
    }
    if (hasSendaiArea) {
      insertCandidatePatterns.push(
        { fromId: 'sendai', toId: 'shiroishizao', name: '仙台〜白石蔵王', insertVias: ['sendai', 'shiroishizao'] },
        { fromId: 'shiroishizao', toId: 'sendai', name: '白石蔵王〜仙台', insertVias: ['shiroishizao', 'sendai'] }
      );
    }
    if (hasNiigataArea) {
      insertCandidatePatterns.push(
        { fromId: 'niigata', toId: 'tsubamesanjo', name: '新潟〜燕三条', insertVias: ['niigata', 'tsubamesanjo'] },
        { fromId: 'tsubamesanjo', toId: 'niigata', name: '燕三条〜新潟', insertVias: ['tsubamesanjo', 'niigata'] }
      );
    }

    for (const pat of insertCandidatePatterns) {
      if (options.checkTimeBudget && options.checkTimeBudget()) break;
      if (deptId === pat.fromId || deptId === pat.toId || destId === pat.fromId || destId === pat.toId) continue;
      const seg = { fromId: pat.fromId, toId: pat.toId };
      const insertVias = pat.insertVias;

      // 経由駅への挿入位置の最適化:
      // midStops が空なら [0] のみ、1駅以上なら迂回増分（detour）が小さい上位2箇所を選定
      let insertPositions = [0];
      if (midStops.length > 0) {
        const fullSequence = [deptId, ...midStops, destId];
        const p1 = stations[pat.fromId];
        const p2 = stations[pat.toId];
        const detours = [];
        for (let k = 0; k <= midStops.length; k++) {
          const u = fullSequence[k];
          const v = fullSequence[k + 1];
          const stU = stations[u];
          const stV = stations[v];
          if (stU && stV && p1 && p2) {
            const detour = calcDistKm(stU, p1) + calcDistKm(p1, p2) + calcDistKm(p2, stV) - calcDistKm(stU, stV);
            detours.push({ pos: k, detour });
          } else {
            detours.push({ pos: k, detour: 9999 });
          }
        }
        detours.sort((a, b) => a.detour - b.detour);
        insertPositions = detours.slice(0, 2).map(d => d.pos);
      }

      for (const pos of insertPositions) {
        const candMid = [...midStops.slice(0, pos), ...insertVias, ...midStops.slice(pos)];
        const bypassRes = cachedSearchFn(deptId, candMid, destId, {
          searchMode: 'oneway',
          useShinkansen: true,
          shinkansenSegments: [seg],
          forceShinkansenOnlyInSegments: true,
          maxBacktrackAttempts: 2,
          maxLegCost: maxLegCost
        });

        if (bypassRes && bypassRes.success && bypassRes.isOneWayTrip && bypassRes.fareRules) {
          // 大迂回除外ガード: baseRoute.totalKm の 2.2倍を超える極端な大回りルートは除外
          if (bypassRes.totalKm > baseRoute.totalKm * 2.2) continue;

          if (bypassRes.fareRules.isSuburbanOnly === false && bypassRes.fareRules.stopoverAllowed === true) {
            if (canStopoverAll(bypassRes, midStops, stations)) {
              const fare = getTicketPrice(bypassRes.fareRules, options.fareType || 'adult');
              const isSep = isSeparateShinkansenBypassPair(pat.fromId, pat.toId);
              const isSingleCo = !bypassRes.fareRules.isInterCompany;
              bypassRes.shinkansenSegments = [seg];
              bypassRes.forceShinkansenOnlyInSegments = true;
              bypassRes.viaIds = candMid;
              const candidateObj = {
                pair: { fromId: pat.fromId, toId: pat.toId, name: pat.name },
                routeResult: bypassRes,
                fare: fare,
                isSingleCompany: isSingleCo,
                isSeparate: isSep
              };
              bypassCandidates.push(candidateObj);

              // 早期リターン（理想的なバイパスが見つかったら即終了）
              if (isIdealBypass(candidateObj)) {
                break;
              }
            }
          }
        }
      }

      // 理想的バイパスが見つかっていればパターンループも終了
      if (bypassCandidates.some(isIdealBypass)) {
        break;
      }
    }

    if (bypassCandidates.length === 0) return [];

    // 重複排除（同じマルス経由・同じ運賃のものは1つにまとめる）
    const uniqueBypasses = new Map();
    for (const b of bypassCandidates) {
      const key = `${b.fare}::${b.routeResult.marsString || b.routeResult.totalKm}`;
      if (!uniqueBypasses.has(key)) {
        uniqueBypasses.set(key, b);
      }
    }

    // 各候補の実質コスト（特急券込み）を付与
    for (const b of uniqueBypasses.values()) {
      b.effectiveFare = b.fare + (b.isSeparate ? 870 : 0);
    }

    // ソート: 実質コスト昇順 -> 運賃昇順 -> 同一線扱い優先 -> 営業キロ昇順
    const sorted = Array.from(uniqueBypasses.values()).sort((a, b) => {
      if (a.effectiveFare !== b.effectiveFare) return a.effectiveFare - b.effectiveFare;
      if (a.fare !== b.fare) return a.fare - b.fare;
      if (a.isSeparate !== b.isSeparate) return a.isSeparate ? 1 : -1;
      if (a.isSingleCompany !== b.isSingleCompany) return a.isSingleCompany ? -1 : 1;
      return a.routeResult.totalKm - b.routeResult.totalKm;
    });

    return sorted.slice(0, 2);
  }

  /**
   * 新幹線1区間組み込みによる大都市近郊区間解除の試行共通ヘルパー（最良1件を返却）
   */
  function trySuburbanBypassWithShinkansen(deptId, midStops, destId, baseRoute, stations, cachedSearchFn, options = {}) {
    const list = findSuburbanBypassesWithShinkansen(deptId, midStops, destId, baseRoute, stations, cachedSearchFn, options);
    return list.length > 0 ? list[0] : null;
  }

  /**
   * 訪問順序の候補生成
   */
  function generateVisitOrders(deptId, visitIds, destId, returnToStart, keepOrder, distMatrix) {
    if (!visitIds || visitIds.length === 0) {
      return [[]];
    }
    if (keepOrder || visitIds.length <= 1) {
      return [visitIds];
    }

    const n = visitIds.length;
    const finalDestId = returnToStart ? deptId : destId;

    function calcOrderDist(order) {
      if (!distMatrix) return 0;
      let total = 0;
      let prev = deptId;
      for (let i = 0; i < order.length; i++) {
        const curr = order[i];
        const key = prev + '::' + curr;
        total += distMatrix.get(key) || 9999;
        prev = curr;
      }
      if (finalDestId) {
        total += distMatrix.get(prev + '::' + finalDestId) || 9999;
      }
      return total;
    }

    if (n <= 5) {
      const results = [];
      function permute(arr, m = []) {
        if (arr.length === 0) {
          results.push(m);
        } else {
          for (let i = 0; i < arr.length; i++) {
            const curr = arr.slice();
            const next = curr.splice(i, 1);
            permute(curr.slice(), m.concat(next));
          }
        }
      }
      permute(visitIds);
      results.sort((a, b) => calcOrderDist(a) - calcOrderDist(b));
      return results.slice(0, 3);
    }

    const candidateOrders = [];
    for (let startIdx = 0; startIdx < n; startIdx++) {
      const remaining = [...visitIds];
      const currentOrder = [remaining.splice(startIdx, 1)[0]];
      let curr = currentOrder[0];

      while (remaining.length > 0) {
        let bestDist = Infinity;
        let bestIdx = 0;
        for (let j = 0; j < remaining.length; j++) {
          const cand = remaining[j];
          const d = distMatrix ? (distMatrix.get(curr + '::' + cand) || 9999) : 0;
          if (d < bestDist) {
            bestDist = d;
            bestIdx = j;
          }
        }
        curr = remaining.splice(bestIdx, 1)[0];
        currentOrder.push(curr);
      }

      let improved = true;
      let iter = 0;
      while (improved && iter < 20) {
        iter++;
        improved = false;
        for (let i = 0; i < n - 1; i++) {
          for (let k = i + 1; k < n; k++) {
            const newOrder = [...currentOrder.slice(0, i), ...currentOrder.slice(i, k + 1).reverse(), ...currentOrder.slice(k + 1)];
            if (calcOrderDist(newOrder) < calcOrderDist(currentOrder) - 0.1) {
              currentOrder.splice(0, n, ...newOrder);
              improved = true;
            }
          }
        }
      }

      const key = currentOrder.join(',');
      if (!candidateOrders.some(o => o.join(',') === key)) {
        candidateOrders.push(currentOrder);
      }
      if (candidateOrders.length >= 2) break;
    }

    candidateOrders.sort((a, b) => calcOrderDist(a) - calcOrderDist(b));
    return candidateOrders.slice(0, 2);
  }

  /**
   * メインAPI: findCheapestTicketPlan
   */
  function findCheapestTicketPlan(deptId, visitIds, options = {}) {
    initDependencies();
    if (!RouteEngine) {
      return { success: false, error: 'RouteEngine is not available' };
    }

    // パラメータ正規化
    const returnToStart = (options.returnToStart !== undefined) ? !!options.returnToStart : true;
    let destId = options.destId || null;
    const keepOrder = !!options.keepOrder;
    const preferStopover = !!options.preferStopover;
    const fareType = options.fareType || 'adult';
    const maxPlans = options.maxPlans || 3;
    let useShinkansen = !!options.useShinkansen;

    // visitIdsのサニタイズ（重複除去・deptId除外）
    let cleanVisitIds = [];
    if (Array.isArray(visitIds)) {
      const seen = new Set([deptId]);
      for (const id of visitIds) {
        if (id && !seen.has(id)) {
          seen.add(id);
          cleanVisitIds.push(id);
        }
      }
    }

    // 単純片道（returnToStart === false && destId指定）の場合は visitIds が空でも探索可能
    if (returnToStart) {
      destId = deptId;
      if (cleanVisitIds.length === 0) {
        return { success: false, error: '行きたい駅を1駅以上指定してください。' };
      }
    } else {
      if (cleanVisitIds.length === 0 && !destId) {
        return { success: false, error: '到着駅または行きたい駅を1駅以上指定してください。' };
      }
      if (!destId) {
        destId = cleanVisitIds[cleanVisitIds.length - 1];
        cleanVisitIds = cleanVisitIds.slice(0, -1);
      }
    }

    // データ参照
    const stations = options.stations || (typeof window !== 'undefined' ? window.JR_STATIONS : null) || {};
    const lines = options.lines || (typeof window !== 'undefined' ? window.JR_LINES : null) || [];
    
    // 計算時間の安全ガード（絶対フリーズ防止）
    const startTime = Date.now();
    const TIME_BUDGET_MS = 1500;
    const checkTimeBudget = () => (Date.now() - startTime) > TIME_BUDGET_MS;

    // 実キロ程を反映した内部グラフの構築（キャッシュ再利用）
    let internalGraph = null;
    if (RouteEngine.getGraph) {
      internalGraph = RouteEngine.getGraph(stations, lines);
    } else if (RouteEngine.buildGraph) {
      internalGraph = RouteEngine.buildGraph(stations, lines);
    }
    if (!internalGraph) {
      internalGraph = new Map();
      lines.forEach(line => {
        if (!line.stations || line.stations.length < 2) return;
        const isShinkansen = !!line.isShinkansen || (typeof line.id === 'string' && line.id.startsWith('shinkansen-'));
        for (let i = 0; i < line.stations.length - 1; i++) {
          const s1 = typeof line.stations[i] === 'object' ? line.stations[i].id : line.stations[i];
          const s2 = typeof line.stations[i + 1] === 'object' ? line.stations[i + 1].id : line.stations[i + 1];
          if (!s1 || !s2) continue;
          const dist = 5.0;
          if (!internalGraph.has(s1)) internalGraph.set(s1, []);
          if (!internalGraph.has(s2)) internalGraph.set(s2, []);
          internalGraph.get(s1).push({ to: s2, dist, lineId: line.id, isShinkansen });
          internalGraph.get(s2).push({ to: s1, dist, lineId: line.id, isShinkansen });
        }
      });
    }

    // 新幹線単独駅が指定駅に含まれているかを事前判定
    const allKeyNodes = Array.from(new Set([deptId, ...cleanVisitIds, ...(destId ? [destId] : [])]));
    const hasShinkansenOnlyStation = allKeyNodes.some(stId => {
      const st = stations[stId];
      if (!st || !st.lines || st.lines.length === 0) return false;
      return st.lines.every(lid => typeof lid === 'string' && lid.startsWith('shinkansen-'));
    });
    if (hasShinkansenOnlyStation) {
      useShinkansen = true;
    }

    // メモ化キャッシュ
    const searchCache = new Map();

    function cachedSearch(fromId, vias, toId, opt = {}) {
      const sMode = opt.searchMode || 'shortest';
      const sShinkansen = (opt.useShinkansen !== undefined) ? opt.useShinkansen : useShinkansen;
      const shSegsKey = (opt.shinkansenSegments || []).map(s => `${s.fromId}-${s.toId}`).join(';');
      const forceSh = opt.forceShinkansenOnlyInSegments ? '1' : '0';
      const maxBacktrack = (opt.maxBacktrackAttempts !== undefined) ? opt.maxBacktrackAttempts : (sMode === 'oneway' ? 2 : 8);
      const key = `${fromId}::${vias.join(',')}::${toId}::${sMode}::${sShinkansen}::${shSegsKey}::${forceSh}`;

      if (searchCache.has(key)) {
        return searchCache.get(key);
      }

      let res = RouteEngine.searchMarsRoute(fromId, vias, toId, {
        ...opt,
        searchMode: sMode,
        useShinkansen: sShinkansen,
        maxBacktrackAttempts: maxBacktrack,
        skipGeometry: true
      });

      // 失敗時の新幹線フォールバック再探索は、新幹線単独駅を含む場合または searchMode === 'shortest' のみに限定
      if ((!res || !res.success) && sShinkansen === false && !hasShinkansenOnlyStation && !opt.shinkansenSegments) {
        if (sMode === 'shortest' || hasShinkansenOnlyStation) {
          res = RouteEngine.searchMarsRoute(fromId, vias, toId, {
            ...opt,
            searchMode: sMode,
            useShinkansen: true,
            maxBacktrackAttempts: maxBacktrack,
            skipGeometry: true
          });
        }
      }

      searchCache.set(key, res);
      return res;
    }

    // 駅間直線距離行列の事前計算（ダイクストラ不要・高速）
    const distMatrix = new Map();
    for (let i = 0; i < allKeyNodes.length; i++) {
      for (let j = 0; j < allKeyNodes.length; j++) {
        if (i === j) continue;
        const u = allKeyNodes[i];
        const v = allKeyNodes[j];
        const stU = stations[u];
        const stV = stations[v];
        if (stU && stV) {
          distMatrix.set(u + '::' + v, calcDistKm(stU, stV));
        }
      }
    }

    // 戦略0: 訪問順序候補の生成
    const visitOrders = generateVisitOrders(deptId, cleanVisitIds, destId, returnToStart, keepOrder, distMatrix);

    // 戦略1: 通常都度買い（ベースライン）の計算
    let baselineFare = Infinity;
    let baselineTickets = [];

    visitOrders.forEach(order => {
      const fullStops = [deptId, ...order, ...(destId ? [destId] : [])];
      let orderFare = 0;
      const tickets = [];
      let ok = true;

      for (let i = 0; i < fullStops.length - 1; i++) {
        const from = fullStops[i];
        const to = fullStops[i + 1];
        const res = cachedSearch(from, [], to, { searchMode: 'shortest' });
        if (!res || !res.success || !res.fareRules) {
          ok = false;
          break;
        }
        const fare = getTicketPrice(res.fareRules, fareType);
        if (fare === Infinity) {
          ok = false;
          break;
        }
        orderFare += fare;
        tickets.push({
          role: 'split',
          label: `乗車券（${(stations[from] && stations[from].name) || from} → ${(stations[to] && stations[to].name) || to}）`,
          quantity: 1,
          unitFare: fare,
          subtotalFare: fare,
          stopoverStations: [],
          extensionDropStation: null,
          routeResult: res
        });
      }

      if (ok && orderFare < baselineFare) {
        baselineFare = orderFare;
        baselineTickets = tickets;
      }
    });

    if (baselineFare === Infinity) {
      baselineFare = 0;
    }

    const candidatePlans = [];

    // ベースラインプラン（通常購入・都度買い）を候補に追加
    if (baselineTickets.length > 0) {
      const totalKm = baselineTickets.reduce((sum, t) => sum + (t.routeResult ? t.routeResult.totalKm : 0), 0);
      const isSingleLeg = (baselineTickets.length === 1);
      candidatePlans.push({
        title: isSingleLeg ? '通常購入（片道乗車券）' : `区間ごと通常購入（${baselineTickets.length}枚構成）`,
        strategyTags: isSingleLeg ? ['通常購入'] : ['区間ごと都度買い'],
        totalFare: baselineFare,
        totalKm: Math.round(totalKm * 10) / 10,
        ticketCount: baselineTickets.length,
        summaryNote: isSingleLeg ? '通常通り1枚の乗車券を購入する標準的な買い方です。' : '各区間を個別に通常購入する標準的な買い方です。',
        tickets: baselineTickets
      });
    }

    // 戦略2: 1枚通し一筆書き＋途中下車 ＆ 新幹線1駅組み込み解除
    const oneWayOrders = (cleanVisitIds.length >= 4) ? visitOrders.slice(0, 2) : visitOrders;
    oneWayOrders.forEach(order => {
      const res = cachedSearch(deptId, order, destId, { searchMode: 'oneway' });
      if (res && res.success && res.isOneWayTrip && res.fareRules) {
        if (canStopoverAll(res, order, stations)) {
          const fare = getTicketPrice(res.fareRules, fareType);
          if (fare < Infinity) {
            const stopNames = order.map(id => (stations[id] && stations[id].name) || id);
            candidatePlans.push({
              title: returnToStart ? '1枚通し一周乗車券＋途中下車' : '1枚通し片道乗車券＋途中下車',
              strategyTags: ['一筆書き＋途中下車'],
              totalFare: fare,
              totalKm: res.totalKm,
              ticketCount: 1,
              summaryNote: (stopNames.length > 0)
                ? `${stopNames.join('・')}駅で途中下車しながら1枚の乗車券で周遊・旅行できます。`
                : '1枚の通し乗車券で旅行できます。',
              tickets: [{
                role: 'main',
                label: returnToStart ? '乗車券①（一周一筆書き乗車券）' : '乗車券①（片道一筆書き乗車券）',
                quantity: 1,
                unitFare: fare,
                subtotalFare: fare,
                stopoverStations: stopNames,
                extensionDropStation: null,
                routeResult: res
              }]
            });
          }
        } else if (res.fareRules.isSuburbanOnly === true && res.totalKm >= 95) {
          // 大都市近郊区間特例で途中下車不可になっている場合：新幹線1区間組み込みバイパスを試行（上位最大2件を登録）
          const bypasses = findSuburbanBypassesWithShinkansen(deptId, order, destId, res, stations, cachedSearch, { fareType, checkTimeBudget });
          for (const bypass of bypasses) {
            const stopNames = order.map(id => (stations[id] && stations[id].name) || id);
            const pairName = bypass.pair.name;
            const validDays = bypass.routeResult.fareRules.validityDays;
            const bypassDetails = getShinkansenBypassDetails(bypass.pair.fromId, bypass.pair.toId, pairName, validDays, stations);
            candidatePlans.push({
              title: `新幹線1区間経由で途中下車可能化（1枚構成）`,
              strategyTags: [bypassDetails.tag, '一筆書き＋途中下車'],
              totalFare: bypass.fare,
              totalKm: bypass.routeResult.totalKm,
              ticketCount: 1,
              summaryNote: bypassDetails.summaryNote,
              tickets: [{
                role: 'main',
                label: returnToStart ? '乗車券①（新幹線1区間経由・一周一筆書き）' : '乗車券①（新幹線1区間経由・片道一筆書き）',
                quantity: 1,
                unitFare: bypass.fare,
                subtotalFare: bypass.fare,
                stopoverStations: stopNames,
                extensionDropStation: null,
                shinkansenSegments: bypass.routeResult.shinkansenSegments || [],
                forceShinkansenOnlyInSegments: !!bypass.routeResult.forceShinkansenOnlyInSegments,
                viaIds: bypass.routeResult.viaIds || order,
                routeResult: bypass.routeResult,
                description: bypassDetails.description
              }]
            });
          }
        }
      }
    });

    // 戦略4: 101km超え ＆ 大都市近郊区間脱出の「先買い（延長購入）」戦略
    // ※単純片道（cleanVisitIdsが空でdestIdあり）でも動作するように拡張
    if (!returnToStart && destId && !checkTimeBudget()) {
      const ordersToExtend = (cleanVisitIds.length > 0) ? visitOrders.slice(0, 2) : [[]];
      ordersToExtend.forEach(order => {
        if (checkTimeBudget()) return;
        const finalTarget = destId;
        const resBase = cachedSearch(deptId, order, finalTarget, { searchMode: 'oneway' });
        const needsExtension = (resBase && resBase.success && resBase.fareRules && (
          resBase.fareRules.stopoverAllowed === false || 
          resBase.fareRules.isSuburbanOnly === true || 
          (fareType === 'student' && resBase.totalKm <= 100)
        ));

        if (needsExtension) {
          const extTargets = findExtensionTargets(internalGraph, deptId, order, finalTarget, stations, lines, { useShinkansen }, cachedSearch, resBase);
          for (const ext of extTargets) {
            if (checkTimeBudget()) break;
            const extFare = getTicketPrice(ext.routeResult.fareRules, fareType);
            const dropName = (stations[finalTarget] && stations[finalTarget].name) || finalTarget;
            const extName = ext.name;

            const isSuburbanExit = (resBase.totalKm > 100 && resBase.fareRules.isSuburbanOnly === true);
            const tag = isSuburbanExit
              ? `大都市近郊区間脱出（${extName}駅まで購入し${dropName}駅で下車・前途放棄）`
              : `101km超え延長買い（${extName}駅まで購入し${dropName}駅で下車・前途放棄）`;
            const note = isSuburbanExit
              ? `${dropName}の先の${extName}駅まで通しで購入することで大都市近郊区間特例を脱出し、途中下車が可能になります（有効期間${ext.routeResult.fareRules.validityDays}日間、${dropName}駅で前途放棄して下車できます）。`
              : `${dropName}の先の${extName}駅まで通しで購入することで営業キロ101kmを超えて途中下車が可能となり、学割等の割引も適用されます（有効期間${ext.routeResult.fareRules.validityDays}日間、${dropName}駅で前途放棄して下車できます）。`;

            candidatePlans.push({
              title: isSuburbanExit ? `近郊区間脱出・延長購入（${extName}まで先買い）` : `101km超え延長購入（${extName}まで先買い）`,
              strategyTags: ['一筆書き＋途中下車', tag],
              totalFare: extFare,
              totalKm: ext.routeResult.totalKm,
              ticketCount: 1,
              summaryNote: note,
              tickets: [
                {
                  role: 'extension',
                  label: `乗車券①（${(stations[deptId] && stations[deptId].name) || deptId} → ${extName}・延長購入）`,
                  quantity: 1,
                  unitFare: extFare,
                  subtotalFare: extFare,
                  stopoverStations: order.map(id => (stations[id] && stations[id].name) || id),
                  extensionDropStation: dropName,
                  routeResult: ext.routeResult,
                  description: `${extName}駅まで購入し、${dropName}駅で下車（前途放棄）`
                }
              ]
            });
          }
        }
      });
    }

    // 戦略5: 最適分割購入（区間DP）
    if (cleanVisitIds.length >= 1 && !checkTimeBudget()) {
      const dpOrders = visitOrders.slice(0, 1);
      dpOrders.forEach(order => {
        if (checkTimeBudget()) return;
        const fullStops = [deptId, ...order, ...(destId ? [destId] : [])];
        const m = fullStops.length - 1;

        const dp = Array.from({ length: m + 1 }, () => ({ cost: Infinity, tickets: [] }));
        dp[0] = { cost: 0, tickets: [] };

        for (let j = 1; j <= m; j++) {
          if (checkTimeBudget()) break;
          for (let i = 0; i < j; i++) {
            if (dp[i].cost === Infinity) continue;
            const s_i = fullStops[i];
            const s_j = fullStops[j];
            const mid = fullStops.slice(i + 1, j);

            if (j === i + 1) {
              const res = cachedSearch(s_i, [], s_j, { searchMode: 'shortest' });
              if (res && res.success && res.fareRules) {
                const fare = getTicketPrice(res.fareRules, fareType);
                if (dp[i].cost + fare < dp[j].cost) {
                  dp[j] = {
                    cost: dp[i].cost + fare,
                    tickets: [
                      ...dp[i].tickets,
                      {
                        role: 'split',
                        label: `乗車券（${(stations[s_i] && stations[s_i].name) || s_i} → ${(stations[s_j] && stations[s_j].name) || s_j}）`,
                        quantity: 1,
                        unitFare: fare,
                        subtotalFare: fare,
                        stopoverStations: [],
                        extensionDropStation: null,
                        routeResult: res
                      }
                    ]
                  };
                }

                // 会社境界駅での2分割チェック
                if (res.totalKm >= 80 && res.allStationIds && res.allStationIds.length > 2) {
                  const intermediateIds = res.allStationIds.slice(1, -1);
                  for (const midId of intermediateIds) {
                    const midSt = stations[midId];
                    if (midSt && COMPANY_BORDER_STATION_NAMES.has(midSt.name)) {
                      const r1 = cachedSearch(s_i, [], midId, { searchMode: 'shortest' });
                      const r2 = cachedSearch(midId, [], s_j, { searchMode: 'shortest' });
                      if (r1 && r1.success && r2 && r2.success) {
                        const f1 = getTicketPrice(r1.fareRules, fareType);
                        const f2 = getTicketPrice(r2.fareRules, fareType);
                        const splitTotal = f1 + f2;
                        if (splitTotal < fare && dp[i].cost + splitTotal < dp[j].cost) {
                          dp[j] = {
                            cost: dp[i].cost + splitTotal,
                            tickets: [
                              ...dp[i].tickets,
                              {
                                role: 'split',
                                label: `乗車券（${(stations[s_i] && stations[s_i].name) || s_i} → ${midSt.name}）`,
                                quantity: 1,
                                unitFare: f1,
                                subtotalFare: f1,
                                stopoverStations: [],
                                extensionDropStation: null,
                                routeResult: r1
                              },
                              {
                                role: 'split',
                                label: `乗車券（${midSt.name} → ${(stations[s_j] && stations[s_j].name) || s_j}）`,
                                quantity: 1,
                                unitFare: f2,
                                subtotalFare: f2,
                                stopoverStations: [],
                                extensionDropStation: null,
                                routeResult: r2
                              }
                            ]
                          };
                        }
                      }
                    }
                  }
                }
              }
            } else if (j === i + 2) {
              let res = cachedSearch(s_i, mid, s_j, { searchMode: 'oneway' });
              let isBypassed = false;
              let bypassDetails = null;
              if (res && res.success && res.fareRules && res.fareRules.isSuburbanOnly === true && res.totalKm >= 90) {
                const bypass = trySuburbanBypassWithShinkansen(s_i, mid, s_j, res, stations, cachedSearch, { fareType, checkTimeBudget });
                if (bypass) {
                  res = bypass.routeResult;
                  isBypassed = true;
                  bypassDetails = getShinkansenBypassDetails(bypass.pair.fromId, bypass.pair.toId, bypass.pair.name, res.fareRules.validityDays, stations);
                }
              }
              if (res && res.success && res.isOneWayTrip && res.fareRules) {
                if (canStopoverAll(res, mid, stations)) {
                  const fare = getTicketPrice(res.fareRules, fareType);
                  if (dp[i].cost + fare < dp[j].cost) {
                    const stopNames = mid.map(id => (stations[id] && stations[id].name) || id);
                    dp[j] = {
                      cost: dp[i].cost + fare,
                      tickets: [
                        ...dp[i].tickets,
                        {
                          role: 'main',
                          label: isBypassed
                            ? `乗車券（${(stations[s_i] && stations[s_i].name) || s_i} → ${(stations[s_j] && stations[s_j].name) || s_j}・新幹線経由途中下車）`
                            : `乗車券（${(stations[s_i] && stations[s_i].name) || s_i} → ${(stations[s_j] && stations[s_j].name) || s_j}・途中下車）`,
                          quantity: 1,
                          unitFare: fare,
                          subtotalFare: fare,
                          stopoverStations: stopNames,
                          extensionDropStation: null,
                          shinkansenSegments: res.shinkansenSegments || [],
                          forceShinkansenOnlyInSegments: !!res.forceShinkansenOnlyInSegments,
                          viaIds: res.viaIds || mid,
                          routeResult: res,
                          bypassDetails: bypassDetails,
                          description: (isBypassed && bypassDetails) ? bypassDetails.description : ''
                        }
                      ]
                    };
                  }
                }
              }
            }
          }
        }

        if (dp[m].cost < Infinity && dp[m].tickets.length > 0) {
          const totalKm = dp[m].tickets.reduce((sum, t) => sum + (t.routeResult ? t.routeResult.totalKm : 0), 0);
          const hasStopover = dp[m].tickets.some(t => t.stopoverStations && t.stopoverStations.length > 0);
          const bypassTicket = dp[m].tickets.find(t => t.bypassDetails);
          const tags = dp[m].tickets.length === 1 ? ['一筆書き＋途中下車'] : (hasStopover ? ['一筆書き＋途中下車', '分割購入'] : ['最適分割購入']);
          if (bypassTicket && bypassTicket.bypassDetails) {
            tags.unshift(bypassTicket.bypassDetails.tag);
          } else if (dp[m].tickets.some(t => t.shinkansenSegments && t.shinkansenSegments.length > 0)) {
            tags.unshift('新幹線1区間組み込み（近郊区間脱出）');
          }

          let note = `${dp[m].tickets.length}枚の乗車券に分割して購入する最適な組み合わせです。`;
          if (bypassTicket && bypassTicket.bypassDetails) {
            note += ` ${bypassTicket.bypassDetails.summaryNote}`;
          }

          candidatePlans.push({
            title: `最適分割購入（${dp[m].tickets.length}枚構成）`,
            strategyTags: tags,
            totalFare: dp[m].cost,
            totalKm: Math.round(totalKm * 10) / 10,
            ticketCount: dp[m].tickets.length,
            summaryNote: note,
            tickets: dp[m].tickets
          });
        }
      });
    }

    // 戦略3: 本線一筆書き ＋ 分岐駅からの「別途往復（ヒゲ分離）」戦略
    if (cleanVisitIds.length >= 1 && !checkTimeBudget()) {
      const junctionMap = new Map();
      cleanVisitIds.forEach(vId => {
        const vSt = stations[vId];
        const isStubStation = vSt && vSt.lines && vSt.lines.length <= 1;
        if (cleanVisitIds.length <= 3 || isStubStation) {
          const juncs = findNearbyJunctions(internalGraph, vId, stations, lines).slice(0, 2);
          junctionMap.set(vId, juncs);
        }
      });

      const evaluatedBranchSets = new Set();
      const branchOrders = visitOrders.slice(0, 2);
      branchOrders.forEach(order => {
        if (checkTimeBudget()) return;
        // 1駅のみの往復（例: 東京発・行きたい駅 ['京都']・returnToStart: true）の場合のジャンクション大回り
        if (order.length === 1 && returnToStart) {
          const vId = order[0];
          const juncs = junctionMap.get(vId) || [];
          for (const j of juncs) {
            if (checkTimeBudget()) break;
            const branchKey = `${deptId}::${j.id}::${destId}::${vId}`;
            if (evaluatedBranchSets.has(branchKey)) continue;
            evaluatedBranchSets.add(branchKey);

            let resMain = cachedSearch(deptId, [j.id], destId, { searchMode: 'oneway' });
            let isBypassed = false;
            let bypassDetails = null;

            // 近郊区間解除バイパス
            if (resMain && resMain.success && resMain.fareRules && resMain.fareRules.isSuburbanOnly === true && resMain.totalKm >= 95) {
              const bypass = trySuburbanBypassWithShinkansen(deptId, [j.id], destId, resMain, stations, cachedSearch, { fareType, checkTimeBudget });
              if (bypass) {
                resMain = bypass.routeResult;
                isBypassed = true;
                bypassDetails = getShinkansenBypassDetails(bypass.pair.fromId, bypass.pair.toId, bypass.pair.name, resMain.fareRules.validityDays, stations);
              }
            }

            if (resMain && resMain.success && resMain.isOneWayTrip && resMain.fareRules) {
              if (canStopoverAll(resMain, [j.id], stations)) {
                const mainFare = getTicketPrice(resMain.fareRules, fareType);
                const resBranch = cachedSearch(j.id, [], vId, { searchMode: 'shortest' });
                if (resBranch && resBranch.success && resBranch.fareRules) {
                  const branchOneWayFare = getTicketPrice(resBranch.fareRules, fareType);
                  const branchRoundFare = branchOneWayFare * 2;
                  const total = mainFare + branchRoundFare;
                  const vName = (stations[vId] && stations[vId].name) || vId;
                  const jName = j.name;

                  const tags = ['一筆書き＋途中下車', `分岐駅往復分離（${jName}⇄${vName}）`];
                  if (isBypassed && bypassDetails) {
                    tags.unshift(bypassDetails.tag);
                  } else if (isBypassed) {
                    tags.unshift('新幹線1区間組み込み（近郊区間脱出）');
                  }

                  let note = `${jName}駅で途中下車し、${jName}⇄${vName}は別途往復乗車券（${branchRoundFare}円）を購入するとお得になります。`;
                  if (isBypassed && bypassDetails) {
                    note += ` ${bypassDetails.summaryNote}`;
                  }

                  candidatePlans.push({
                    title: `大回り一筆書き＋分岐往復（2枚構成）`,
                    strategyTags: tags,
                    totalFare: total,
                    totalKm: Math.round((resMain.totalKm + resBranch.totalKm * 2) * 10) / 10,
                    ticketCount: 2,
                    summaryNote: note,
                    tickets: [
                      {
                        role: 'main',
                        label: '乗車券①（本線・一周一筆書き）',
                        quantity: 1,
                        unitFare: mainFare,
                        subtotalFare: mainFare,
                        stopoverStations: [jName],
                        extensionDropStation: null,
                        shinkansenSegments: resMain.shinkansenSegments || [],
                        forceShinkansenOnlyInSegments: !!resMain.forceShinkansenOnlyInSegments,
                        viaIds: resMain.viaIds || [j.id],
                        routeResult: resMain,
                        description: (isBypassed && bypassDetails) ? bypassDetails.description : ''
                      },
                      {
                        role: 'branch-roundtrip',
                        label: `乗車券②（別途往復：${jName} ⇄ ${vName}）`,
                        quantity: 2,
                        unitFare: branchOneWayFare,
                        subtotalFare: branchRoundFare,
                        stopoverStations: [vName],
                        extensionDropStation: null,
                        routeResult: resBranch
                      }
                    ]
                  });
                }
              }
            }
          }
        }

        // 複数駅でのヒゲ分離探索
        const directOneWayRes = cachedSearch(deptId, order, destId, { searchMode: 'oneway' });
        const hasDirectOneWay = (directOneWayRes && directOneWayRes.success && directOneWayRes.isOneWayTrip);

        for (let i = 0; i < order.length; i++) {
          if (checkTimeBudget()) break;
          const vId = order[i];
          const vSt = stations[vId];
          const isStubStation = vSt && vSt.lines && vSt.lines.length <= 1;
          if (hasDirectOneWay && !isStubStation) continue;

          let bypassFoundForStation = false;
          const juncs = junctionMap.get(vId) || [];
          for (const j of juncs) {
            if (checkTimeBudget()) break;
            const mainStops = [...order];
            mainStops[i] = j.id;

            const branchKey = `${deptId}::${mainStops.join(',')}::${destId}::${vId}::${j.id}`;
            if (evaluatedBranchSets.has(branchKey)) continue;
            evaluatedBranchSets.add(branchKey);

            let resMain = cachedSearch(deptId, mainStops, destId, { searchMode: 'oneway' });

            const mainVariants = [];
            if (resMain && resMain.success && resMain.fareRules) {
              if (resMain.fareRules.isSuburbanOnly === true && resMain.totalKm >= 95) {
                const bypasses = findSuburbanBypassesWithShinkansen(deptId, mainStops, destId, resMain, stations, cachedSearch, { fareType, checkTimeBudget });
                for (const bypass of bypasses) {
                  const bDetails = getShinkansenBypassDetails(bypass.pair.fromId, bypass.pair.toId, bypass.pair.name, bypass.routeResult.fareRules.validityDays, stations);
                  mainVariants.push({
                    res: bypass.routeResult,
                    isBypassed: true,
                    bypassDetails: bDetails
                  });
                }
              }
              if (mainVariants.length === 0 || resMain.fareRules.isSuburbanOnly === false) {
                mainVariants.push({
                  res: resMain,
                  isBypassed: false,
                  bypassDetails: null
                });
              }
            }

            for (const variant of mainVariants) {
              const curMain = variant.res;
              const isBypassed = variant.isBypassed;
              const bypassDetails = variant.bypassDetails;

              if (curMain && curMain.success && curMain.isOneWayTrip && curMain.fareRules) {
                if (canStopoverAll(curMain, mainStops, stations)) {
                  const mainFare = getTicketPrice(curMain.fareRules, fareType);
                  const resBranch = cachedSearch(j.id, [], vId, { searchMode: 'shortest' });
                  if (resBranch && resBranch.success && resBranch.fareRules) {
                    const branchOneWayFare = getTicketPrice(resBranch.fareRules, fareType);
                    const branchRoundFare = branchOneWayFare * 2;
                    const total = mainFare + branchRoundFare;
                    const vName = (stations[vId] && stations[vId].name) || vId;
                    const jName = j.name;

                    const stopoverNames = mainStops.map(id => (stations[id] && stations[id].name) || id);
                    const tags = ['一筆書き＋途中下車', `分岐駅往復分離（${jName}⇄${vName}）`];
                    if (isBypassed && bypassDetails) {
                      tags.unshift(bypassDetails.tag);
                    } else if (isBypassed) {
                      tags.unshift('新幹線1区間組み込み（近郊区間脱出）');
                    }

                    let note = `${jName}で途中下車し、${jName}⇄${vName}は別途往復乗車券（${branchRoundFare}円）を購入すると最安になります。`;
                    if (isBypassed && bypassDetails) {
                      note += ` ${bypassDetails.summaryNote}`;
                    }

                    candidatePlans.push({
                      title: `一筆書き＋分岐駅往復（2枚構成）`,
                      strategyTags: tags,
                      totalFare: total,
                      totalKm: Math.round((curMain.totalKm + resBranch.totalKm * 2) * 10) / 10,
                      ticketCount: 2,
                      summaryNote: note,
                      tickets: [
                        {
                          role: 'main',
                          label: returnToStart ? '乗車券①（本線・一周一筆書き）' : '乗車券①（本線・片道一筆書き）',
                          quantity: 1,
                          unitFare: mainFare,
                          subtotalFare: mainFare,
                          stopoverStations: stopoverNames,
                          extensionDropStation: null,
                          shinkansenSegments: curMain.shinkansenSegments || [],
                          forceShinkansenOnlyInSegments: !!curMain.forceShinkansenOnlyInSegments,
                          viaIds: curMain.viaIds || mainStops,
                          routeResult: curMain,
                          description: (isBypassed && bypassDetails) ? bypassDetails.description : ''
                        },
                        {
                          role: 'branch-roundtrip',
                          label: `乗車券②（別途往復：${jName} ⇄ ${vName}）`,
                          quantity: 2,
                          unitFare: branchOneWayFare,
                          subtotalFare: branchRoundFare,
                          stopoverStations: [vName],
                          extensionDropStation: null,
                          routeResult: resBranch
                        }
                      ]
                    });
                  }
                }
              }
            }
          }
        }
      });
    }

    // プランの属性評価・正規化シグネチャによる重複排除
    const uniquePlansMap = new Map();
    candidatePlans.forEach(p => {
      if (p.totalFare === Infinity) return;
      
      // 別途特急券が必要な完全別線新幹線バイパスが含まれているか判定
      let requiresExpressTicket = false;
      if (p.tickets && p.tickets.length > 0) {
        for (const t of p.tickets) {
          const segs = t.shinkansenSegments || (t.routeResult && t.routeResult.shinkansenSegments) || [];
          if (segs.some(s => isSeparateShinkansenBypassPair(s.fromId, s.toId))) {
            requiresExpressTicket = true;
            break;
          }
        }
      }
      p.requiresExpressTicket = requiresExpressTicket;
      p.effectiveFare = requiresExpressTicket ? (p.totalFare + 870) : p.totalFare;

      // 途中下車フレンドリー判定
      // 全チケットで途中下車可能、または途中下車可能チケットを含み訪問駅で途中下車できる
      const isStopoverFriendly = p.tickets.every(t => {
        if (!t.routeResult || !t.routeResult.fareRules) return false;
        // 分岐往復や延長買いでの下車駅などを含めて判定
        return (t.routeResult.fareRules.stopoverAllowed === true) || (t.role === 'branch-roundtrip' && t.subtotalFare < 500);
      }) || p.tickets.some(t => t.stopoverStations && t.stopoverStations.length > 0 && t.routeResult && t.routeResult.fareRules && t.routeResult.fareRules.stopoverAllowed);

      p.isStopoverFriendly = !!isStopoverFriendly;
      p.diffFromBaseline = p.totalFare - baselineFare;

      // 正規化シグネチャ
      const ticketSig = p.tickets.map(t => {
        const r = t.routeResult;
        const lineChain = r && r.sections ? r.sections.map(s => s.lineId).join('-') : '';
        const mars = r ? (r.marsString || '') : '';
        const stopover = (r && r.fareRules) ? r.fareRules.stopoverAllowed : false;
        const from = t.deptId || (r ? r.deptId : '');
        const to = t.destId || (r ? r.destId : '');
        return `${from}_${to}_${t.unitFare}_${t.quantity}_${stopover}_${mars || lineChain}`;
      }).join('|');
      const sigKey = `${p.totalFare}::${p.effectiveFare}::${ticketSig}`;

      if (!uniquePlansMap.has(sigKey)) {
        uniquePlansMap.set(sigKey, p);
      }
    });

    const allUniquePlans = Array.from(uniquePlansMap.values());

    // ソート順の制御
    let sortedPlans = [];
    if (preferStopover) {
      // 途中下車優先モード: 現実的な追加運賃（通常最安+35%以内または+￥1,500以内）で途中下車可能なプランを優先上位にソート
      sortedPlans = allUniquePlans.slice().sort((a, b) => {
        const aReasonable = isReasonableStopoverUpgrade(a, baselineFare);
        const bReasonable = isReasonableStopoverUpgrade(b, baselineFare);
        if (aReasonable !== bReasonable) {
          return aReasonable ? -1 : 1;
        }
        if (a.effectiveFare !== b.effectiveFare) {
          return a.effectiveFare - b.effectiveFare;
        }
        if (a.totalFare !== b.totalFare) {
          return a.totalFare - b.totalFare;
        }
        if (a.isStopoverFriendly !== b.isStopoverFriendly) {
          return a.isStopoverFriendly ? -1 : 1;
        }
        if (a.ticketCount !== b.ticketCount) return a.ticketCount - b.ticketCount;
        return a.totalKm - b.totalKm;
      });

      // ユーザー比較のため、実質最安（または絶対最安）プランが上位3案に含まれていない場合は3案目に保持する
      const absoluteCheapestPlan = allUniquePlans.slice().sort((a, b) => {
        if (a.effectiveFare !== b.effectiveFare) return a.effectiveFare - b.effectiveFare;
        return a.totalFare - b.totalFare;
      })[0];
      if (absoluteCheapestPlan && sortedPlans.length > 0) {
        const top3 = sortedPlans.slice(0, maxPlans);
        if (!top3.some(p => p.totalFare === absoluteCheapestPlan.totalFare && p.effectiveFare === absoluteCheapestPlan.effectiveFare)) {
          if (sortedPlans.length >= maxPlans) {
            sortedPlans[maxPlans - 1] = absoluteCheapestPlan;
          }
        }
      }
    } else {
      // 最安最優先モード
      sortedPlans = allUniquePlans.slice().sort((a, b) => {
        if (a.effectiveFare !== b.effectiveFare) {
          return a.effectiveFare - b.effectiveFare;
        }
        if (a.totalFare !== b.totalFare) {
          return a.totalFare - b.totalFare;
        }
        if (a.isStopoverFriendly !== b.isStopoverFriendly) {
          return a.isStopoverFriendly ? -1 : 1;
        }
        if (a.ticketCount !== b.ticketCount) return a.ticketCount - b.ticketCount;
        return a.totalKm - b.totalKm;
      });
    }

    const topPlans = sortedPlans.slice(0, maxPlans);

    // 上位プランの確定と完全ジオメトリ（skipGeometry: false）の再生成
    const fullResultCache = new Map();
    topPlans.forEach((plan, idx) => {
      plan.rank = idx + 1;
      plan.planId = `plan-${idx + 1}`;
      plan.name = plan.title;
      plan.savings = Math.max(0, baselineFare - plan.totalFare);
      plan.tags = plan.strategyTags || [];
      plan.summary = plan.summaryNote || '';
      plan.explanation = plan.summaryNote || '';

      // 各チケットの完全な routeResult を生成 & プロパティの正規化
      plan.tickets.forEach((ticket, tIdx) => {
        if (ticket.routeResult) {
          const r = ticket.routeResult;
          const ticketHasSh = !!(r.sections && r.sections.some(s => s.isShinkansen)) || useShinkansen || !!(r.shinkansenSegments && r.shinkansenSegments.length > 0) || !!(ticket.shinkansenSegments && ticket.shinkansenSegments.length > 0);
          const shSegs = (r.options && r.options.shinkansenSegments) ? r.options.shinkansenSegments : (r.shinkansenSegments || (ticket.shinkansenSegments || []));
          const forceSh = !!(r.options && r.options.forceShinkansenOnlyInSegments) || !!r.forceShinkansenOnlyInSegments || !!ticket.forceShinkansenOnlyInSegments;
          const shSegKey = shSegs.map(s => `${s.fromId}-${s.toId}`).join(';');
          const vias = (r.viaIds && r.viaIds.length > 0) ? r.viaIds : (ticket.viaIds || []);

          const fullKey = `${r.deptId}::${vias.join(',')}::${r.destId}::${r.isOneWayTrip ? 'oneway' : 'shortest'}::${ticketHasSh}::${shSegKey}::${forceSh}`;
          if (fullResultCache.has(fullKey)) {
            ticket.routeResult = fullResultCache.get(fullKey);
          } else {
            const fullRes = RouteEngine.searchMarsRoute(r.deptId, vias, r.destId, {
              searchMode: r.isOneWayTrip ? 'oneway' : 'shortest',
              useShinkansen: ticketHasSh,
              shinkansenSegments: shSegs,
              forceShinkansenOnlyInSegments: forceSh,
              skipGeometry: false
            });
            fullResultCache.set(fullKey, fullRes);
            ticket.routeResult = fullRes;
          }
        }

        const res = ticket.routeResult;
        ticket.ticketId = `ticket-${idx + 1}-${tIdx + 1}`;
        ticket.fare = ticket.subtotalFare || ticket.unitFare || 0;
        ticket.typeName = ticket.label || (ticket.role === 'round_trip' || ticket.role === 'branch-roundtrip' ? '往復乗車券' : '普通乗車券');
        ticket.deptId = res ? res.deptId : '';
        ticket.destId = res ? res.destId : '';
        ticket.deptName = res ? res.deptName : (stations[ticket.deptId] ? stations[ticket.deptId].name : '');
        ticket.destName = res ? res.destName : (stations[ticket.destId] ? stations[ticket.destId].name : '');
        ticket.totalKm = res ? res.totalKm : 0;
        ticket.validDays = (res && res.fareRules && res.fareRules.validityDays) ? res.fareRules.validityDays : 1;
        ticket.stopoverAllowed = (res && res.fareRules) ? res.fareRules.stopoverAllowed : false;
        ticket.description = ticket.description || ticket.note || '';
        ticket.role = ticket.role || 'single';
        ticket.extensionDropStation = ticket.extensionDropStation || null;
        ticket.stopoverStations = ticket.stopoverStations || [];
      });
    });

    return {
      success: true,
      deptId: deptId,
      visitIds: cleanVisitIds,
      destId: destId,
      returnToStart: returnToStart,
      preferStopover: preferStopover,
      fareType: fareType,
      baselineFare: baselineFare,
      plans: topPlans
    };
  }

  // エクスポート
  const OptimizerEngine = {
    findCheapestTicketPlan,
    findSuburbanBypassesWithShinkansen,
    getTicketPrice,
    canStopoverAll,
    findNearbyJunctions,
    findExtensionTargets,
    trySuburbanBypassWithShinkansen,
    isSeparateShinkansenBypassPair,
    getShinkansenBypassDetails,
    generateVisitOrders
  };

  if (typeof window !== 'undefined') {
    window.JR_OPTIMIZER_ENGINE = OptimizerEngine;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = OptimizerEngine;
  }
})();
