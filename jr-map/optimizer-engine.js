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
    { fromId: 'tokyo', toId: 'shin-yokohama', name: '東京〜新横浜' },
    { fromId: 'shin-yokohama', toId: 'tokyo', name: '新横浜〜東京' },
    { fromId: 'shinagawa', toId: 'shin-yokohama', name: '品川〜新横浜' },
    { fromId: 'shin-yokohama', toId: 'shinagawa', name: '新横浜〜品川' },
    { fromId: 'tokyo', toId: 'omiya', name: '東京〜大宮' },
    { fromId: 'omiya', toId: 'tokyo', name: '大宮〜東京' },
    { fromId: 'ueno', toId: 'omiya', name: '上野〜大宮' },
    { fromId: 'omiya', toId: 'ueno', name: '大宮〜上野' },
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
    if (!stopIds || stopIds.length === 0) return true;
    if (routeResult.fareRules.stopoverAllowed !== true) return false;

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
   * 新幹線1区間組み込みによる大都市近郊区間解除の試行共通ヘルパー
   */
  function trySuburbanBypassWithShinkansen(deptId, midStops, destId, baseRoute, stations, cachedSearchFn, options = {}) {
    if (!baseRoute || !baseRoute.success || !baseRoute.fareRules) return null;
    if (baseRoute.fareRules.isSuburbanOnly !== true) return null;
    if (baseRoute.totalKm < 90) return null; // 100km超えまたはその境界付近のみ対象

    const allNodes = baseRoute.allStationIds || [];
    const nodeIndexMap = new Map();
    allNodes.forEach((id, idx) => {
      if (!nodeIndexMap.has(id)) nodeIndexMap.set(id, idx);
    });

    let bestBypass = null;
    let minFare = Infinity;

    // パターン1: 既存ルートの通過駅に新幹線ペアが含まれている場合
    for (const pair of SUBURBAN_BYPASS_SHINKANSEN_PAIRS) {
      if (nodeIndexMap.has(pair.fromId) && nodeIndexMap.has(pair.toId)) {
        const idxFrom = nodeIndexMap.get(pair.fromId);
        const idxTo = nodeIndexMap.get(pair.toId);
        if (idxFrom < idxTo) {
          const bypassRes = cachedSearchFn(deptId, midStops, destId, {
            searchMode: 'oneway',
            useShinkansen: true,
            shinkansenSegments: [{ fromId: pair.fromId, toId: pair.toId }],
            forceShinkansenOnlyInSegments: true
          });

          if (bypassRes && bypassRes.success && bypassRes.isOneWayTrip && bypassRes.fareRules) {
            if (bypassRes.fareRules.isSuburbanOnly === false && bypassRes.fareRules.stopoverAllowed === true) {
              if (canStopoverAll(bypassRes, midStops, stations)) {
                const fare = getTicketPrice(bypassRes.fareRules, options.fareType || 'adult');
                if (fare < minFare) {
                  minFare = fare;
                  bestBypass = {
                    pair,
                    routeResult: bypassRes,
                    fare: fare
                  };
                }
              }
            }
          }
        }
      }
    }

    if (bestBypass) return bestBypass;

    // パターン2: ルート上に新幹線駅が含まれていない場合、主要新幹線ペアを経由駅に挿入して試行
    const insertPairs = [
      { fromId: 'shinagawa', toId: 'tokyo', name: '品川〜東京' },
      { fromId: 'tokyo', toId: 'ueno', name: '東京〜上野' },
      { fromId: 'shin-osaka', toId: 'kyoto', name: '新大阪〜京都' }
    ];

    for (const pair of insertPairs) {
      if (deptId === pair.fromId || deptId === pair.toId || destId === pair.fromId || destId === pair.toId) continue;
      // 経由駅の先頭または末尾に挿入して試行
      const insertPositions = [0, midStops.length];
      for (const pos of insertPositions) {
        const candMid = [...midStops.slice(0, pos), pair.fromId, pair.toId, ...midStops.slice(pos)];
        const bypassRes = cachedSearchFn(deptId, candMid, destId, {
          searchMode: 'oneway',
          useShinkansen: true,
          shinkansenSegments: [{ fromId: pair.fromId, toId: pair.toId }],
          forceShinkansenOnlyInSegments: true
        });

        if (bypassRes && bypassRes.success && bypassRes.isOneWayTrip && bypassRes.fareRules) {
          if (bypassRes.fareRules.isSuburbanOnly === false && bypassRes.fareRules.stopoverAllowed === true) {
            if (canStopoverAll(bypassRes, midStops, stations)) {
              const fare = getTicketPrice(bypassRes.fareRules, options.fareType || 'adult');
              if (fare < minFare) {
                minFare = fare;
                bestBypass = {
                  pair,
                  routeResult: bypassRes,
                  fare: fare
                };
              }
            }
          }
        }
      }
    }

    return bestBypass;
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
    
    // 実キロ程を反映した内部グラフの構築
    let internalGraph = null;
    if (RouteEngine.buildGraph) {
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
      const key = `${fromId}::${vias.join(',')}::${toId}::${sMode}::${sShinkansen}::${shSegsKey}::${forceSh}`;

      if (searchCache.has(key)) {
        return searchCache.get(key);
      }

      let res = RouteEngine.searchMarsRoute(fromId, vias, toId, {
        ...opt,
        searchMode: sMode,
        useShinkansen: sShinkansen,
        skipGeometry: true
      });

      if ((!res || !res.success) && sShinkansen === false && !hasShinkansenOnlyStation && !opt.shinkansenSegments) {
        res = RouteEngine.searchMarsRoute(fromId, vias, toId, {
          ...opt,
          searchMode: sMode,
          useShinkansen: true,
          skipGeometry: true
        });
      }

      searchCache.set(key, res);
      return res;
    }

    // 駅間距離行列の事前計算
    const distMatrix = new Map();
    for (let i = 0; i < allKeyNodes.length; i++) {
      for (let j = 0; j < allKeyNodes.length; j++) {
        if (i === j) continue;
        const u = allKeyNodes[i];
        const v = allKeyNodes[j];
        const res = cachedSearch(u, [], v, { searchMode: 'shortest' });
        if (res && res.success) {
          distMatrix.set(u + '::' + v, res.totalKm);
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
          // 大都市近郊区間特例で途中下車不可になっている場合：新幹線1区間組み込みバイパスを試行
          const bypass = trySuburbanBypassWithShinkansen(deptId, order, destId, res, stations, cachedSearch, { fareType });
          if (bypass) {
            const stopNames = order.map(id => (stations[id] && stations[id].name) || id);
            const pairName = bypass.pair.name;
            candidatePlans.push({
              title: `新幹線1区間経由で途中下車可能化（1枚構成）`,
              strategyTags: ['新幹線1区間組み込み（近郊区間脱出）', '一筆書き＋途中下車'],
              totalFare: bypass.fare,
              totalKm: bypass.routeResult.totalKm,
              ticketCount: 1,
              summaryNote: `${pairName}間を新幹線経由とすることで大都市近郊区間特例を外し、途中下車（有効期間${bypass.routeResult.fareRules.validityDays}日間）を可能にするテクニックです。`,
              tickets: [{
                role: 'main',
                label: returnToStart ? '乗車券①（新幹線1区間経由・一周一筆書き）' : '乗車券①（新幹線1区間経由・片道一筆書き）',
                quantity: 1,
                unitFare: bypass.fare,
                subtotalFare: bypass.fare,
                stopoverStations: stopNames,
                extensionDropStation: null,
                routeResult: bypass.routeResult,
                description: `${pairName}間新幹線利用により途中下車可能化`
              }]
            });
          }
        }
      }
    });

    // 戦略3: 本線一筆書き ＋ 分岐駅からの「別途往復（ヒゲ分離）」戦略
    if (cleanVisitIds.length >= 1) {
      const junctionMap = new Map();
      cleanVisitIds.forEach(vId => {
        const vSt = stations[vId];
        const isStubStation = vSt && vSt.lines && vSt.lines.length <= 1;
        if (cleanVisitIds.length <= 3 || isStubStation) {
          const juncs = findNearbyJunctions(internalGraph, vId, stations, lines);
          junctionMap.set(vId, juncs);
        }
      });

      const branchOrders = visitOrders.slice(0, 1);
      branchOrders.forEach(order => {
        // 1駅のみの往復（例: 東京発・行きたい駅 ['京都']・returnToStart: true）の場合のジャンクション大回り
        if (order.length === 1 && returnToStart) {
          const vId = order[0];
          const juncs = junctionMap.get(vId) || [];
          for (const j of juncs) {
            let resMain = cachedSearch(deptId, [j.id], destId, { searchMode: 'oneway' });
            let isBypassed = false;
            let bypassPairName = '';

            // 近郊区間解除バイパス
            if (resMain && resMain.success && resMain.fareRules && resMain.fareRules.isSuburbanOnly === true && resMain.totalKm >= 95) {
              const bypass = trySuburbanBypassWithShinkansen(deptId, [j.id], destId, resMain, stations, cachedSearch, { fareType });
              if (bypass) {
                resMain = bypass.routeResult;
                isBypassed = true;
                bypassPairName = bypass.pair.name;
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
                  if (isBypassed) tags.unshift('新幹線1区間組み込み（近郊区間脱出）');

                  candidatePlans.push({
                    title: `大回り一筆書き＋分岐往復（2枚構成）`,
                    strategyTags: tags,
                    totalFare: total,
                    totalKm: Math.round((resMain.totalKm + resBranch.totalKm * 2) * 10) / 10,
                    ticketCount: 2,
                    summaryNote: `${jName}駅で途中下車し、${jName}⇄${vName}は別途往復乗車券（${branchRoundFare}円）を購入するとお得になります。${isBypassed ? `（${bypassPairName}間新幹線経由で途中下車可能化）` : ''}`,
                    tickets: [
                      {
                        role: 'main',
                        label: '乗車券①（本線・一周一筆書き）',
                        quantity: 1,
                        unitFare: mainFare,
                        subtotalFare: mainFare,
                        stopoverStations: [jName],
                        extensionDropStation: null,
                        routeResult: resMain
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
          const vId = order[i];
          const vSt = stations[vId];
          const isStubStation = vSt && vSt.lines && vSt.lines.length <= 1;
          if (hasDirectOneWay && !isStubStation) continue;

          const juncs = junctionMap.get(vId) || [];
          for (const j of juncs) {
            const mainStops = [...order];
            mainStops[i] = j.id;

            let resMain = cachedSearch(deptId, mainStops, destId, { searchMode: 'oneway' });
            let isBypassed = false;
            let bypassPairName = '';

            if (resMain && resMain.success && resMain.fareRules && resMain.fareRules.isSuburbanOnly === true && resMain.totalKm >= 95) {
              const bypass = trySuburbanBypassWithShinkansen(deptId, mainStops, destId, resMain, stations, cachedSearch, { fareType });
              if (bypass) {
                resMain = bypass.routeResult;
                isBypassed = true;
                bypassPairName = bypass.pair.name;
              }
            }

            if (resMain && resMain.success && resMain.isOneWayTrip && resMain.fareRules) {
              if (canStopoverAll(resMain, mainStops, stations)) {
                const mainFare = getTicketPrice(resMain.fareRules, fareType);
                const resBranch = cachedSearch(j.id, [], vId, { searchMode: 'shortest' });
                if (resBranch && resBranch.success && resBranch.fareRules) {
                  const branchOneWayFare = getTicketPrice(resBranch.fareRules, fareType);
                  const branchRoundFare = branchOneWayFare * 2;
                  const total = mainFare + branchRoundFare;
                  const vName = (stations[vId] && stations[vId].name) || vId;
                  const jName = j.name;

                  const stopoverNames = mainStops.map(id => (stations[id] && stations[id].name) || id);
                  const tags = ['一筆書き＋途中下車', `分岐駅往復分離（${jName}⇄${vName}）`];
                  if (isBypassed) tags.unshift('新幹線1区間組み込み（近郊区間脱出）');

                  candidatePlans.push({
                    title: `一筆書き＋分岐駅往復（2枚構成）`,
                    strategyTags: tags,
                    totalFare: total,
                    totalKm: Math.round((resMain.totalKm + resBranch.totalKm * 2) * 10) / 10,
                    ticketCount: 2,
                    summaryNote: `${jName}で途中下車し、${jName}⇄${vName}は別途往復乗車券（${branchRoundFare}円）を購入すると最安になります。${isBypassed ? `（${bypassPairName}間新幹線経由で途中下車可能化）` : ''}`,
                    tickets: [
                      {
                        role: 'main',
                        label: returnToStart ? '乗車券①（本線・一周一筆書き）' : '乗車券①（本線・片道一筆書き）',
                        quantity: 1,
                        unitFare: mainFare,
                        subtotalFare: mainFare,
                        stopoverStations: stopoverNames,
                        extensionDropStation: null,
                        routeResult: resMain
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
      });
    }

    // 戦略4: 101km超え ＆ 大都市近郊区間脱出の「先買い（延長購入）」戦略
    // ※単純片道（cleanVisitIdsが空でdestIdあり）でも動作するように拡張
    if (!returnToStart && destId) {
      const ordersToExtend = (cleanVisitIds.length > 0) ? visitOrders : [[]];
      ordersToExtend.forEach(order => {
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
    if (cleanVisitIds.length >= 1) {
      const dpOrders = visitOrders.slice(0, 2);
      dpOrders.forEach(order => {
        const fullStops = [deptId, ...order, ...(destId ? [destId] : [])];
        const m = fullStops.length - 1;

        const dp = Array.from({ length: m + 1 }, () => ({ cost: Infinity, tickets: [] }));
        dp[0] = { cost: 0, tickets: [] };

        for (let j = 1; j <= m; j++) {
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
              const res = cachedSearch(s_i, mid, s_j, { searchMode: 'oneway' });
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
                          label: `乗車券（${(stations[s_i] && stations[s_i].name) || s_i} → ${(stations[s_j] && stations[s_j].name) || s_j}・途中下車）`,
                          quantity: 1,
                          unitFare: fare,
                          subtotalFare: fare,
                          stopoverStations: stopNames,
                          extensionDropStation: null,
                          routeResult: res
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
          const tags = dp[m].tickets.length === 1 ? ['一筆書き＋途中下車'] : (hasStopover ? ['一筆書き＋途中下車', '分割購入'] : ['最適分割購入']);

          candidatePlans.push({
            title: `最適分割購入（${dp[m].tickets.length}枚構成）`,
            strategyTags: tags,
            totalFare: dp[m].cost,
            totalKm: Math.round(totalKm * 10) / 10,
            ticketCount: dp[m].tickets.length,
            summaryNote: `${dp[m].tickets.length}枚の乗車券に分割して購入する最適な組み合わせです。`,
            tickets: dp[m].tickets
          });
        }
      });
    }

    // プランの属性評価・正規化シグネチャによる重複排除
    const uniquePlansMap = new Map();
    candidatePlans.forEach(p => {
      if (p.totalFare === Infinity) return;
      
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
      const sigKey = `${p.totalFare}::${ticketSig}`;

      if (!uniquePlansMap.has(sigKey)) {
        uniquePlansMap.set(sigKey, p);
      }
    });

    const allUniquePlans = Array.from(uniquePlansMap.values());

    // ソート順の制御
    let sortedPlans = [];
    if (preferStopover) {
      // 途中下車優先モード: 途中下車可能なプランを上位にソート
      sortedPlans = allUniquePlans.slice().sort((a, b) => {
        if (a.isStopoverFriendly !== b.isStopoverFriendly) {
          return a.isStopoverFriendly ? -1 : 1;
        }
        if (a.totalFare !== b.totalFare) return a.totalFare - b.totalFare;
        if (a.ticketCount !== b.ticketCount) return a.ticketCount - b.ticketCount;
        return a.totalKm - b.totalKm;
      });

      // ユーザー比較のため、絶対最安プランが上位3案に含まれていない場合は3案目に保持する
      const absoluteCheapestPlan = allUniquePlans.slice().sort((a, b) => a.totalFare - b.totalFare)[0];
      if (absoluteCheapestPlan && sortedPlans.length > 0) {
        const top3 = sortedPlans.slice(0, maxPlans);
        if (!top3.some(p => p.totalFare === absoluteCheapestPlan.totalFare)) {
          if (sortedPlans.length >= maxPlans) {
            sortedPlans[maxPlans - 1] = absoluteCheapestPlan;
          }
        }
      }
    } else {
      // 最安最優先モード
      sortedPlans = allUniquePlans.slice().sort((a, b) => {
        if (a.totalFare !== b.totalFare) return a.totalFare - b.totalFare;
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
          const ticketHasSh = !!(r.sections && r.sections.some(s => s.isShinkansen)) || useShinkansen;
          const shSegs = (r.options && r.options.shinkansenSegments) ? r.options.shinkansenSegments : (r.shinkansenSegments || []);
          const forceSh = !!(r.options && r.options.forceShinkansenOnlyInSegments);
          const shSegKey = shSegs.map(s => `${s.fromId}-${s.toId}`).join(';');

          const fullKey = `${r.deptId}::${r.viaIds ? r.viaIds.join(',') : ''}::${r.destId}::${r.isOneWayTrip ? 'oneway' : 'shortest'}::${ticketHasSh}::${shSegKey}::${forceSh}`;
          if (fullResultCache.has(fullKey)) {
            ticket.routeResult = fullResultCache.get(fullKey);
          } else {
            const fullRes = RouteEngine.searchMarsRoute(r.deptId, r.viaIds || [], r.destId, {
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
    getTicketPrice,
    canStopoverAll,
    findNearbyJunctions,
    findExtensionTargets,
    trySuburbanBypassWithShinkansen,
    generateVisitOrders
  };

  if (typeof window !== 'undefined') {
    window.JR_OPTIMIZER_ENGINE = OptimizerEngine;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = OptimizerEngine;
  }
})();
