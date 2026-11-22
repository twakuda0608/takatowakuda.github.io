/**
 * JR Route Engine & MARS Route Generator
 * マルス経由線名算出 & 一筆書き・最短経路探索エンジン
 */
(function() {
  // 1. マルス路線名辞書 (JR旅客営業規則・マルス経由線略称)
  const MARS_LINE_NAMES = {
    // 新幹線
    'shinkansen-tokaido': '東海新',
    'shinkansen-sanyo': '山陽新',
    'shinkansen-tohoku': '東北新',
    'shinkansen-joetsu': '上越新',
    'shinkansen-hokuriku': '北陸新',
    'shinkansen-kyushu': '九州新',
    'shinkansen-nishi-kyushu': '西九州新',
    'shinkansen-hokkaido': '北海新',
    'shinkansen-yamagata': '奥羽',
    'shinkansen-akita': '田沢湖',

    // 関東・東日本主要幹線
    'yamanote': '山手',
    'tokaido': '東海道',
    'chuo-main': '中央東',
    'chuo-tatsuno': '辰野',
    'tokai-chuo': '中央西',
    'sobu-main': '総武',
    'tohoku-main': '東北',
    'joban': '常磐',
    'takasaki-line': '高崎',
    'joetsu-line': '上越',
    'shinetsu-line': '信越',
    'shinetsu-takasaki': '信越',
    'shinonoi-line': '篠ノ井',
    'negishi-line': '根岸',
    'yokohama-line': '横浜',
    'nambu': '南武',
    'tsurumi-line': '鶴見',
    'musashino': '武蔵野',
    'keiyo': '京葉',
    'akabane-line': '赤羽',
    'yokosuka-line': '横須賀',
    'sagami': '相模',
    'ito-line': '伊東',
    'ome-line': '青梅',
    'itsukaichi-line': '五日市',
    'hachiko-line': '八高',
    'kawagoe-line': '川越',
    'ryomo-line': '両毛',
    'mito-line': '水戸',
    'nikko-line': '日光',
    'karasuyama-line': '烏山',
    'agatsuma-line': '吾妻',
    'uchibo-line': '内房',
    'sotobo-line': '外房',
    'narita-line': '成田',
    'kashima-line': '鹿島',
    'kururi-line': '久留里',
    'togane-line': '東金',
    'suigun-line': '水郡',

    // 東北・甲信越
    'banetsu-west': '磐越西',
    'banetsu-east': '磐越東',
    'ou-main': '奥羽',
    'uetsu-main': '羽越',
    'senzan-line': '仙山',
    'senseki-line': '仙石',
    'ishinomaki-line': '石巻',
    'ofunato-line': '大船渡',
    'kamaishi-line': '釜石',
    'yamada-line': '山田',
    'hachinohe-line': '八戸',
    'hanawa-line': '花輪',
    'kitakami-line': '北上',
    'tazawako-line': '田沢湖',
    'tsugaru-line': '津軽',
    'ominato-line': '大湊',
    'gonou-line': '五能',
    'oga-line': '男鹿',
    'rikuuto-line': '陸羽東',
    'rikuusai-line': '陸羽西',
    'yonesaka-line': '米坂',
    'aterazawa-line': '左沢',
    'tadami-line': '只見',
    'echigo-line': '越後',
    'yahiko-line': '弥彦',
    'hakushin-line': '白新',
    'iiyama-line': '飯山',
    'oito-line': '大糸',
    'oito-west': '大糸',
    'koumi-line': '小海',

    // 東海
    'tokai-tokaido': '東海道',
    'tokai-minoakasaka': '赤坂',
    'tokai-kansai': '関西',
    'tokai-kisei': '紀勢',
    'tokai-takayama': '高山',
    'tokai-iida': '飯田',
    'tokai-minobu': '身延',
    'tokai-gotemba': '御殿場',
    'tokai-taketoyo': '武豊',
    'tokai-taita': '太多',
    'tokai-sangu': '参宮',
    'tokai-meisho': '名松',

    // 近畿・西日本
    'tokaido-west': '東海道',
    'sanyo-main': '山陽',
    'sanyo-wadamisaki': '山陽',
    'sanin-main': '山陰',
    'sanin-wadayama': '山陰',
    'sanin-senzaki': '山陰',
    'osaka-loop': '大阪環',
    'jr-tozai': '東西',
    'fukuchiyama-line': '福知山',
    'hanwa-line': '阪和',
    'kansai-west': '関西',
    'nara-line': '奈良',
    'hokuriku-main': '北陸',
    'kosei-line': '湖西',
    'kusatsu-line': '草津',
    'kisei-west': '紀勢',
    'wakayama-line': '和歌山',
    'sakurai-line': '桜井',
    'kanku-line': '関空',
    'katamachi-line': '片町',
    'osaka-higashi': 'おおさか東',
    'bantan-line': '播但',
    'maizuru-line': '舞鶴',
    'hakubi-line': '伯備',
    'kishin-line': '姫新',
    'tsuyama-line': '津山',
    'kibi-line': '吉備',
    'uno-line': '宇野',
    'seto-ohashi-west': '本四備讃',
    'akaho-line': '赤穂',
    'ako-line': '赤穂',
    'geibi-line': '芸備',
    'fukuen-line': '福塩',
    'kure-line': '呉',
    'kabe-line': '可部',
    'gantoku-line': '岩徳',
    'yamaguchi-line': '山口',
    'mine-line': '美祢',
    'ube-line': '宇部',
    'onoda-line': '小野田',
    'inbi-line': '因美',
    'imbi-line': '因美',
    'sakai-line': '境',
    'kisuki-line': '木次',

    // 四国
    'shikoku-yosan': '予讃',
    'shikoku-yosan-new': '予讃',
    'shikoku-dosan': '土讃',
    'shikoku-kotoku': '高徳',
    'shikoku-tokushima': '徳島',
    'shikoku-naruto': '鳴門',
    'shikoku-mugi': '牟岐',
    'shikoku-yodo': '予土',
    'shikoku-uchiko': '内子',
    'shikoku-seto-ohashi': '本四備讃',

    // 九州
    'kyushu-kagoshima': '鹿児島',
    'kyushu-nippo': '日豊',
    'kyushu-sanyo': '山陽',
    'kyushu-nagasaki': '長崎',
    'kyushu-nagasaki-nagayo': '長崎',
    'kyushu-sasebo': '佐世保',
    'kyushu-omura': '大村',
    'kyushu-kyudai': '久大',
    'kyushu-hohi': '豊肥',
    'kyushu-misumi': '三角',
    'kyushu-hisatsu': '肥薩',
    'kyushu-kitto': '吉都',
    'kyushu-nichinan': '日南',
    'kyushu-miyazaki-kuko': '宮崎空',
    'kyushu-miyazaki-airport': '宮崎空',
    'kyushu-ibusuki': '指宿枕',
    'kyushu-chikuhi': '筑肥',
    'kyushu-karatsu': '唐津',
    'kyushu-chikuho': '筑豊',
    'kyushu-sasaguri': '篠栗',
    'kyushu-gotoji': '後藤寺',
    'kyushu-kashii': '香椎',
    'hakataminami-line': '博多南',

    // 北海道
    'hokkaido-hakodate': '函館',
    'hokkaido-hakodate-sawara': '函館',
    'hokkaido-chitose': '千歳',
    'hokkaido-chitose-airport': '千歳',
    'hokkaido-muroran': '室蘭',
    'hokkaido-muroran-branch': '室蘭',
    'hokkaido-sekisho': '石勝',
    'hokkaido-nemuro': '根室',
    'hokkaido-furano': '富良野',
    'hokkaido-soya': '宗谷',
    'hokkaido-sekihoku': '石北',
    'hokkaido-senmo': '釧網',
    'hokkaido-sassho': '札沼',
    'hokkaido-rumoi': '留萌',
    'hokkaido-hidaka': '日高',
    'hokkaido-kaikyo': '海峡'
  };

  function getMarsLineName(line) {
    if (!line) return '';
    if (MARS_LINE_NAMES[line.id]) return MARS_LINE_NAMES[line.id];
    let name = line.name || '';
    name = name.replace('本線', '').replace('線', '');
    if (line.category === 'shinkansen' && !name.endsWith('新')) {
      name += '新';
    }
    return name;
  }

  // 2点間距離 (km)
  function calcDistKm(st1, st2) {
    const dLat = (st1.lat - st2.lat) * 111.13;
    const dLng = (st1.lng - st2.lng) * 91.0;
    return Math.sqrt(dLat * dLat + dLng * dLng);
  }

  // 駅間営業キロ（エッジ距離）の取得
  // official-kilos.js を唯一の参照元 (Single Source of Truth) に一本化
  function getEdgeDistance(line, stU, stV, uId, vId) {
    if (!stU || !stV) return { dist: 0, isEstimated: false };

    // 優先度 1: official-kilos.js により路線データ (JR_LINES) に設定された営業キロプロパティ
    if (line) {
      // 1-a: edgeDistances (隣接駅間の営業キロマップ: { 'st1-st2': 1.3, ... })
      if (line.edgeDistances) {
        const k1 = `${uId}-${vId}`;
        const k2 = `${vId}-${uId}`;
        const kName1 = `${stU.name}-${stV.name}`;
        const kName2 = `${stV.name}-${stU.name}`;
        const d = line.edgeDistances[k1] ?? line.edgeDistances[k2] ??
                  line.edgeDistances[kName1] ?? line.edgeDistances[kName2];
        if (d !== undefined && d !== null) {
          return { dist: Math.round(d * 10) / 10, isEstimated: false };
        }
      }
      // 1-b: stationKilos (駅ごとの累計営業キロテーブル: { 'tokyo': 0.0, 'mitaka': 24.1, ... })
      if (line.stationKilos) {
        const kU = (uId && line.stationKilos[uId] !== undefined) ? line.stationKilos[uId] : line.stationKilos[stU.name];
        const kV = (vId && line.stationKilos[vId] !== undefined) ? line.stationKilos[vId] : line.stationKilos[stV.name];
        if (kU !== undefined && kV !== undefined) {
          const d = Math.abs(kV - kU);
          return { dist: Math.round(d * 10) / 10, isEstimated: false };
        }
      }
    }

    // 優先度 2: 緯度・経度からの直線距離 (概算フォールバック: isEstimated = true)
    const estDist = Math.round(calcDistKm(stU, stV) * 10) / 10;
    return { dist: estDist, isEstimated: true };
  }

  let cachedGraph = null;
  let cachedStations = null;
  let cachedLines = null;

  // グラフ構築
  function buildGraph(arg1, arg2) {
    let lines, stations;
    if (Array.isArray(arg1)) {
      lines = arg1;
      stations = arg2 || (typeof window !== 'undefined' ? window.JR_STATIONS : {}) || {};
    } else if (Array.isArray(arg2)) {
      lines = arg2;
      stations = arg1 || (typeof window !== 'undefined' ? window.JR_STATIONS : {}) || {};
    } else {
      if (typeof window !== 'undefined') {
        stations = window.JR_STATIONS || window.STATIONS || {};
        lines = window.JR_LINES || [];
      } else if (typeof require !== 'undefined') {
        try {
          const bd = require('./data/build-data.js');
          stations = bd.JR_STATIONS;
          lines = bd.JR_LINES;
        } catch(e) {
          try {
            const bd = require('./jr-map/data/build-data.js');
            stations = bd.JR_STATIONS;
            lines = bd.JR_LINES;
          } catch(e2) {
            stations = {};
            lines = [];
          }
        }
      }
    }

    // 公式キロ程データ (official-kilos.js) の適用
    if (typeof window !== 'undefined' && window.applyOfficialKilos) {
      window.applyOfficialKilos(lines);
    } else if (typeof require !== 'undefined') {
      try {
        const kilosMod = require('./data/official-kilos.js');
        if (kilosMod && kilosMod.applyOfficialKilos) {
          kilosMod.applyOfficialKilos(lines);
        }
      } catch (e) {
        try {
          const kilosMod = require('./jr-map/data/official-kilos.js');
          if (kilosMod && kilosMod.applyOfficialKilos) {
            kilosMod.applyOfficialKilos(lines);
          }
        } catch(e2) {}
      }
    }

    const adj = new Map(); // stationId -> Array of edges

    lines.forEach(line => {
      const isShinkansen = line.category === 'shinkansen';
      const marsName = getMarsLineName(line);
      const chains = [line.stations, ...(line.branches || [])];

      chains.forEach(stIds => {
        if (!stIds || !Array.isArray(stIds)) return;
        for (let i = 0; i < stIds.length - 1; i++) {
          const u = stIds[i];
          const v = stIds[i + 1];
          const stU = stations[u];
          const stV = stations[v];
          if (!stU || !stV) continue;

          const edgeDistInfo = getEdgeDistance(line, stU, stV, u, v);
          const dist = (typeof edgeDistInfo === 'object') ? edgeDistInfo.dist : edgeDistInfo;
          const isEstimated = (typeof edgeDistInfo === 'object') ? !!edgeDistInfo.isEstimated : false;

          if (!adj.has(u)) adj.set(u, []);
          if (!adj.has(v)) adj.set(v, []);

          adj.get(u).push({
            to: v,
            lineId: line.id,
            lineName: line.name,
            marsName: marsName,
            color: line.color || '#0070c0',
            isShinkansen: isShinkansen,
            dist: dist,
            isEstimated: isEstimated
          });

          adj.get(v).push({
            to: u,
            lineId: line.id,
            lineName: line.name,
            marsName: marsName,
            color: line.color || '#0070c0',
            isShinkansen: isShinkansen,
            dist: dist,
            isEstimated: isEstimated
          });
        }
      });

      // 環状線（isLoop: true）の終端と先頭の接続（物理的近接時）
      if (line.isLoop && line.stations && line.stations.length >= 3) {
        const u = line.stations[line.stations.length - 1];
        const v = line.stations[0];
        const stU = stations[u];
        const stV = stations[v];
        if (stU && stV && calcDistKm(stU, stV) < 5.0) {
          const edgeDistInfo = getEdgeDistance(line, stU, stV, u, v);
          const dist = (typeof edgeDistInfo === 'object') ? edgeDistInfo.dist : edgeDistInfo;
          const isEstimated = (typeof edgeDistInfo === 'object') ? !!edgeDistInfo.isEstimated : false;

          if (!adj.has(u)) adj.set(u, []);
          if (!adj.has(v)) adj.set(v, []);

          adj.get(u).push({
            to: v,
            lineId: line.id,
            lineName: line.name,
            marsName: marsName,
            color: line.color || '#0070c0',
            isShinkansen: isShinkansen,
            dist: dist,
            isEstimated: isEstimated
          });

          adj.get(v).push({
            to: u,
            lineId: line.id,
            lineName: line.name,
            marsName: marsName,
            color: line.color || '#0070c0',
            isShinkansen: isShinkansen,
            dist: dist,
            isEstimated: isEstimated
          });
        }
      }
    });

    cachedGraph = adj;
    cachedStations = stations;
    cachedLines = lines;

    return adj;
  }

  // 単一レグ探索 (状態空間ダイクストラ法: stationId + marsName)
  function findLeg(graph, startId, endId, options = {}) {
    const allowShinkansen = (options.useShinkansen !== undefined) ? options.useShinkansen : (options.allowShinkansen !== false);
    const forbiddenStations = options.forbiddenStations || new Set();

    const dist = new Map();
    const prev = new Map();
    const pq = [{ id: startId, marsName: '', isShinkansen: false, d: 0 }];
    dist.set(startId + '::', 0);

    let bestEndState = null;

    while (pq.length > 0) {
      pq.sort((a, b) => a.d - b.d);
      const curr = pq.shift();
      const currKey = curr.id + '::' + curr.marsName;

      if (curr.id === endId) {
        bestEndState = currKey;
        break;
      }

      if (curr.d > dist.get(currKey)) continue;

      const neighbors = graph.get(curr.id) || [];
      for (const edge of neighbors) {
        if (!allowShinkansen && edge.isShinkansen) continue;
        if (options.forceShinkansen && !edge.isShinkansen) continue;
        if (forbiddenStations.has(edge.to) && edge.to !== endId) continue;

        let transferPenalty = 0;
        if (curr.marsName && (curr.marsName !== edge.marsName)) {
          if (curr.isShinkansen && !edge.isShinkansen) {
            // 新幹線乗車中から在来線への乗換は途中下車ショートカットを防ぐためペナルティ (8.0)
            transferPenalty = 8.0;
          } else if (!curr.isShinkansen && edge.isShinkansen) {
            // 在来線から新幹線への乗換はペナルティなし (0.0)
            transferPenalty = 0.0;
          } else {
            // 同一距離の場合に乗り換えの少ない方を選ぶ微小タイブレーカー (0.01)
            transferPenalty = 0.01;
          }
        }

        // 純粋な営業キロベースで探索 (useShinkansen時は同距離での新幹線優先タイブレーカー -0.001 を適用)
        const shinkansenBias = (allowShinkansen && edge.isShinkansen) ? -0.001 : 0;
        const edgeWeight = edge.dist + shinkansenBias;
        const nextD = curr.d + edgeWeight + transferPenalty;
        const nextKey = edge.to + '::' + edge.marsName;

        if (!dist.has(nextKey) || nextD < dist.get(nextKey)) {
          dist.set(nextKey, nextD);
          prev.set(nextKey, {
            fromId: curr.id,
            fromMars: curr.marsName,
            edge: edge
          });
          pq.push({ id: edge.to, marsName: edge.marsName, isShinkansen: edge.isShinkansen, d: nextD });
        }
      }
    }

    if (!bestEndState) return null;

    const segments = [];
    let currKey = bestEndState;
    while (true) {
      const p = prev.get(currKey);
      if (!p) break;
      segments.unshift({
        from: p.fromId,
        to: p.edge.to,
        lineId: p.edge.lineId,
        lineName: p.edge.lineName,
        marsName: p.edge.marsName,
        color: p.edge.color,
        isShinkansen: p.edge.isShinkansen,
        dist: p.edge.dist,
        isEstimated: !!p.edge.isEstimated
      });
      currKey = p.fromId + '::' + p.fromMars;
    }

    return segments;
  }

  // 最近傍線路インデックス検索
  function findClosestTrackIdx(chain, lat, lng) {
    let minD = Infinity;
    let minIdx = -1;
    for (let i = 0; i < chain.length; i++) {
      const pt = chain[i];
      const dLat = pt[0] - lat;
      const dLng = pt[1] - lng;
      const d = dLat * dLat + dLng * dLng;
      if (d < minD) {
        minD = d;
        minIdx = i;
      }
    }
    return minIdx;
  }

  // セグメント線路座標の抽出 (駅間エッジ対応・候補路線フォールバック・確実な端点スナップ)
  function getSegmentCoords(tracks, stations, lineId, fromStId, toStId) {
    const st1 = stations[fromStId];
    const st2 = stations[toStId];
    if (!st1 || !st2) return [];

    // 候補路線リスト: 指定路線を最優先、次に駅同士の共通路線
    const candidateLineIds = [lineId];
    if (st1.lines && st2.lines) {
      st1.lines.forEach(lid => {
        if (st2.lines.includes(lid) && !candidateLineIds.includes(lid)) {
          candidateLineIds.push(lid);
        }
      });
    }

    let bestChain = null;
    let bestIdx1 = -1;
    let bestIdx2 = -1;
    let bestDistSum = Infinity;

    candidateLineIds.forEach(lid => {
      const rawChains = tracks[lid] || [];
      rawChains.forEach(rawChain => {
        // [lat, lng] への確実な正規化
        const chain = rawChain.map(pt => pt[0] > 90 ? [pt[1], pt[0]] : pt);
        let i1 = -1, minD1 = Infinity;
        let i2 = -1, minD2 = Infinity;

        for (let i = 0; i < chain.length; i++) {
          const p = chain[i];
          const d1 = Math.hypot(p[0] - st1.lat, p[1] - st1.lng);
          const d2 = Math.hypot(p[0] - st2.lat, p[1] - st2.lng);
          if (d1 < minD1) { minD1 = d1; i1 = i; }
          if (d2 < minD2) { minD2 = d2; i2 = i; }
        }

        if (i1 >= 0 && i2 >= 0) {
          const dSum = minD1 + minD2;
          if (dSum < bestDistSum) {
            bestDistSum = dSum;
            bestChain = chain;
            bestIdx1 = i1;
            bestIdx2 = i2;
          }
        }
      });
    });

    // 閾値チェック (約15km以内)
    if (!bestChain || bestDistSum > 0.15) {
      return [[st1.lat, st1.lng], [st2.lat, st2.lng]];
    }

    let rawSlice = [];
    if (bestIdx1 === bestIdx2) {
      rawSlice = [bestChain[bestIdx1]];
    } else if (bestIdx1 < bestIdx2) {
      rawSlice = bestChain.slice(bestIdx1, bestIdx2 + 1);
    } else {
      rawSlice = bestChain.slice(bestIdx2, bestIdx1 + 1).reverse();
    }

    // 端点を st1 と st2 に確実にスナップ接続 (駅マーカーと線路の隙間をゼロに)
    const resultCoords = [[st1.lat, st1.lng]];
    for (let k = 0; k < rawSlice.length; k++) {
      const p = rawSlice[k];
      const prev = resultCoords[resultCoords.length - 1];
      if (Math.hypot(p[0] - prev[0], p[1] - prev[1]) > 0.00005) {
        resultCoords.push(p);
      }
    }
    const lastP = resultCoords[resultCoords.length - 1];
    if (Math.hypot(st2.lat - lastP[0], st2.lng - lastP[1]) > 0.00005) {
      resultCoords.push([st2.lat, st2.lng]);
    }

    return resultCoords;
  }

  /**
   * 駅名または駅IDから正確な駅オブジェクトを解決する
   * 同名異駅（例：大阪環状線「福島」と東北新幹線「福島」）の誤マッチを防止するため、
   * 1. stops に含まれる駅IDを最優先
   * 2. 新幹線路線を有する駅を優先
   * 3. 全体から検索
   */
  function resolveStation(stId, stName, stops, stations) {
    if (stId && stations[stId]) return stations[stId];
    if (!stName) return null;
    if (stops && Array.isArray(stops)) {
      for (const id of stops) {
        if (stations[id] && stations[id].name === stName) {
          return stations[id];
        }
      }
    }
    const shinkansenMatch = Object.values(stations).find(s => s.name === stName && s.lines && s.lines.some(l => l.startsWith('shinkansen-')));
    if (shinkansenMatch) return shinkansenMatch;
    return Object.values(stations).find(s => s.name === stName);
  }

  /**
   * 新幹線指定区間を経由駅リスト (stops) に自動統合・展開する
   */
  function expandStopsWithShinkansen(stops, shinkansenSegs, stations) {
    if (!shinkansenSegs || shinkansenSegs.length === 0 || !stops || stops.length < 2) return stops;
    let result = [...stops];

    for (const seg of shinkansenSegs) {
      const fromSt = resolveStation(seg.fromId, seg.from || seg.fromName, stops, stations);
      const toSt = resolveStation(seg.toId, seg.to || seg.toName, stops, stations);
      if (!fromSt || !toSt) continue;

      const id1 = fromSt.id;
      const id2 = toSt.id;

      // 既に id1 と id2 が連続して含まれているかチェック
      let alreadyPaired = false;
      for (let i = 0; i < result.length - 1; i++) {
        if ((result[i] === id1 && result[i + 1] === id2) || (result[i] === id2 && result[i + 1] === id1)) {
          alreadyPaired = true;
          break;
        }
      }
      if (alreadyPaired) continue;

      const idx1 = result.indexOf(id1);
      const idx2 = result.indexOf(id2);

      if (idx1 >= 0 && idx2 === -1) {
        if (idx1 < result.length - 1) {
          result.splice(idx1 + 1, 0, id2);
        } else {
          result.splice(idx1, 0, id2);
        }
      } else if (idx2 >= 0 && idx1 === -1) {
        if (idx2 > 0) {
          result.splice(idx2, 0, id1);
        } else {
          result.splice(idx2 + 1, 0, id1);
        }
      } else if (idx1 === -1 && idx2 === -1) {
        if (result.length >= 2) {
          result.splice(1, 0, id1, id2);
        }
      }
    }

    return result;
  }

  // 旅規第16条の2 同一線扱い新幹線・並行在来線区間 (Corridor) ビルダー
  // ※東海道新幹線 (東京〜新大阪) は2026年3月改定により東海道本線と別線扱いのため含めない
  let CACHED_PARALLEL_CORRIDORS = null;
  function getSameLineParallelCorridors(stations, lines) {
    if (CACHED_PARALLEL_CORRIDORS) return CACHED_PARALLEL_CORRIDORS;

    let targetLines = lines || cachedLines;
    if (!targetLines || targetLines.length === 0) {
      if (typeof window !== 'undefined' && window.JR_LINES) targetLines = window.JR_LINES;
      else if (typeof require !== 'undefined') {
        try { targetLines = require('./data/build-data.js').JR_LINES; } catch(e) {
          try { targetLines = require('./jr-map/data/build-data.js').JR_LINES; } catch(e2) {}
        }
      }
    }

    let targetStations = stations || cachedStations;
    if (!targetStations || Object.keys(targetStations).length === 0) {
      if (typeof window !== 'undefined' && (window.STATIONS || window.JR_STATIONS)) targetStations = window.STATIONS || window.JR_STATIONS;
      else if (typeof require !== 'undefined') {
        try { targetStations = require('./data/build-data.js').JR_STATIONS; } catch(e) {
          try { targetStations = require('./jr-map/data/build-data.js').JR_STATIONS; } catch(e2) {}
        }
      }
    }

    if (!targetLines || !targetStations) return [];

    const lineMap = {};
    targetLines.forEach(l => lineMap[l.id] = l);

    function getStationNames(lineId, fromName, toName) {
      const l = lineMap[lineId];
      if (!l) return [];
      const names = l.stations.map(id => targetStations[id]?.name).filter(Boolean);
      const i1 = names.indexOf(fromName);
      const i2 = names.indexOf(toName);
      if (i1 === -1 || i2 === -1) return [];
      const s = Math.min(i1, i2);
      const e = Math.max(i1, i2);
      return names.slice(s, e + 1);
    }

    const corridorDefs = [
      // 東北新幹線 (東京〜盛岡)
      { id: 'same-line::tohoku::tokyo-ueno', sLine: 'shinkansen-tohoku', sSts: ['東京', '上野'], cLines: ['tohoku-main'], cSts: ['東京', '上野'] },
      {
        id: 'same-line::tohoku::ueno-omiya',
        sLine: 'shinkansen-tohoku',
        sSts: ['上野', '大宮'],
        cLines: ['tohoku-main', 'akabane-line'],
        cSts: [
          '上野', '日暮里', '西日暮里', '田端', '尾久', '赤羽', '川口', '西川口', '蕨',
          '南浦和', '浦和', '北浦和', '与野', 'さいたま新都心', '大宮',
          '北赤羽', '浮間舟渡', '戸田公園', '戸田', '北戸田', '武蔵浦和', '中浦和', '南与野', '与野本町', '北与野'
        ]
      },
      { id: 'same-line::tohoku::omiya-oyama', sLine: 'shinkansen-tohoku', sSts: ['大宮', '小山'], cLines: ['tohoku-main'], cSts: getStationNames('tohoku-main', '大宮', '小山') },
      { id: 'same-line::tohoku::oyama-utsunomiya', sLine: 'shinkansen-tohoku', sSts: ['小山', '宇都宮'], cLines: ['tohoku-main'], cSts: getStationNames('tohoku-main', '小山', '宇都宮') },
      { id: 'same-line::tohoku::utsunomiya-nasushiobara', sLine: 'shinkansen-tohoku', sSts: ['宇都宮', '那須塩原'], cLines: ['tohoku-main'], cSts: getStationNames('tohoku-main', '宇都宮', '那須塩原') },
      { id: 'same-line::tohoku::nasushiobara-shinshirakawa', sLine: 'shinkansen-tohoku', sSts: ['那須塩原', '新白河'], cLines: ['tohoku-main'], cSts: getStationNames('tohoku-main', '那須塩原', '新白河') },
      { id: 'same-line::tohoku::shinshirakawa-koriyama', sLine: 'shinkansen-tohoku', sSts: ['新白河', '郡山'], cLines: ['tohoku-main'], cSts: getStationNames('tohoku-main', '新白河', '郡山') },
      { id: 'same-line::tohoku::koriyama-fukushima', sLine: 'shinkansen-tohoku', sSts: ['郡山', '福島'], cLines: ['tohoku-main'], cSts: getStationNames('tohoku-main', '郡山', '福島') },
      { id: 'same-line::tohoku::fukushima-sendai', sLine: 'shinkansen-tohoku', sSts: ['福島', '白石蔵王', '仙台'], cLines: ['tohoku-main'], cSts: getStationNames('tohoku-main', '福島', '仙台') },
      { id: 'same-line::tohoku::sendai-ichinoseki', sLine: 'shinkansen-tohoku', sSts: ['仙台', '古川', 'くりこま高原', '一ノ関'], cLines: ['tohoku-main'], cSts: getStationNames('tohoku-main', '仙台', '一ノ関') },
      { id: 'same-line::tohoku::ichinoseki-kitakami', sLine: 'shinkansen-tohoku', sSts: ['一ノ関', '水沢江刺', '北上'], cLines: ['tohoku-main'], cSts: getStationNames('tohoku-main', '一ノ関', '北上') },
      { id: 'same-line::tohoku::kitakami-morioka', sLine: 'shinkansen-tohoku', sSts: ['北上', '新花巻', '盛岡'], cLines: ['tohoku-main'], cSts: getStationNames('tohoku-main', '北上', '盛岡') },

      // 上越新幹線 (大宮〜新潟)
      { id: 'same-line::joetsu::omiya-takasaki', sLine: 'shinkansen-joetsu', sSts: ['大宮', '熊谷', '本庄早稲田', '高崎'], cLines: ['takasaki-line'], cSts: getStationNames('takasaki-line', '大宮', '高崎') },
      { id: 'same-line::joetsu::takasaki-echigoyuzawa', sLine: 'shinkansen-joetsu', sSts: ['高崎', '上毛高原', '越後湯沢'], cLines: ['joetsu-line'], cSts: getStationNames('joetsu-line', '高崎', '越後湯沢') },
      { id: 'same-line::joetsu::echigoyuzawa-urasa', sLine: 'shinkansen-joetsu', sSts: ['越後湯沢', '浦佐'], cLines: ['joetsu-line'], cSts: getStationNames('joetsu-line', '越後湯沢', '浦佐') },
      { id: 'same-line::joetsu::urasa-nagaoka', sLine: 'shinkansen-joetsu', sSts: ['浦佐', '長岡'], cLines: ['joetsu-line', 'shinetsu-line'], cSts: [...getStationNames('joetsu-line', '浦佐', '宮内'), ...getStationNames('shinetsu-line', '宮内', '長岡')] },
      { id: 'same-line::joetsu::nagaoka-niigata', sLine: 'shinkansen-joetsu', sSts: ['長岡', '燕三条', '新潟'], cLines: ['shinetsu-line'], cSts: getStationNames('shinetsu-line', '長岡', '新潟') },

      // 山陽新幹線 (新大阪〜博多)
      { id: 'same-line::sanyo::shinosaka-nishiakashi', sLine: 'shinkansen-sanyo', sSts: ['新大阪', '新神戸', '西明石'], cLines: ['tokaido-west', 'sanyo-main'], cSts: [...getStationNames('tokaido-west', '新大阪', '神戸'), ...getStationNames('sanyo-main', '神戸', '西明石')] },
      { id: 'same-line::sanyo::nishiakashi-himeji', sLine: 'shinkansen-sanyo', sSts: ['西明石', '姫路'], cLines: ['sanyo-main'], cSts: getStationNames('sanyo-main', '西明石', '姫路') },
      { id: 'same-line::sanyo::himeji-aioi', sLine: 'shinkansen-sanyo', sSts: ['姫路', '相生'], cLines: ['sanyo-main'], cSts: getStationNames('sanyo-main', '姫路', '相生') },
      { id: 'same-line::sanyo::aioi-okayama', sLine: 'shinkansen-sanyo', sSts: ['相生', '岡山'], cLines: ['sanyo-main'], cSts: getStationNames('sanyo-main', '相生', '岡山') },
      { id: 'same-line::sanyo::okayama-shinkurashiki', sLine: 'shinkansen-sanyo', sSts: ['岡山', '新倉敷'], cLines: ['sanyo-main'], cSts: getStationNames('sanyo-main', '岡山', '新倉敷') },
      { id: 'same-line::sanyo::shinkurashiki-fukuyama', sLine: 'shinkansen-sanyo', sSts: ['新倉敷', '福山'], cLines: ['sanyo-main'], cSts: getStationNames('sanyo-main', '新倉敷', '福山') },
      { id: 'same-line::sanyo::fukuyama-mihara', sLine: 'shinkansen-sanyo', sSts: ['福山', '新尾道', '三原'], cLines: ['sanyo-main'], cSts: getStationNames('sanyo-main', '福山', '三原') },
      { id: 'same-line::sanyo::mihara-hiroshima', sLine: 'shinkansen-sanyo', sSts: ['三原', '東広島', '広島'], cLines: ['sanyo-main'], cSts: getStationNames('sanyo-main', '三原', '広島') },
      { id: 'same-line::sanyo::hiroshima-tokuyama', sLine: 'shinkansen-sanyo', sSts: ['広島', '新岩国', '徳山'], cLines: ['sanyo-main'], cSts: getStationNames('sanyo-main', '広島', '徳山') },
      { id: 'same-line::sanyo::tokuyama-shinyamaguchi', sLine: 'shinkansen-sanyo', sSts: ['徳山', '新山口'], cLines: ['sanyo-main'], cSts: getStationNames('sanyo-main', '徳山', '新山口') },
      { id: 'same-line::sanyo::shinyamaguchi-asa', sLine: 'shinkansen-sanyo', sSts: ['新山口', '厚狭'], cLines: ['sanyo-main'], cSts: getStationNames('sanyo-main', '新山口', '厚狭') },
      { id: 'same-line::sanyo::asa-shinshimonoseki', sLine: 'shinkansen-sanyo', sSts: ['厚狭', '新下関'], cLines: ['sanyo-main'], cSts: getStationNames('sanyo-main', '厚狭', '新下関') },
      {
        id: 'same-line::sanyo::shinshimonoseki-kokura',
        sLine: 'shinkansen-sanyo',
        sSts: ['新下関', '小倉'],
        cLines: ['sanyo-main', 'kyushu-sanyo', 'kyushu-kagoshima'],
        cSts: [
          ...getStationNames('sanyo-main', '新下関', '下関'),
          ...getStationNames('kyushu-sanyo', '下関', '門司'),
          ...getStationNames('kyushu-kagoshima', '門司', '小倉')
        ]
      },
      { id: 'same-line::sanyo::kokura-hakata', sLine: 'shinkansen-sanyo', sSts: ['小倉', '博多'], cLines: ['kyushu-kagoshima'], cSts: getStationNames('kyushu-kagoshima', '小倉', '博多') },

      // 九州新幹線 (博多〜新八代)
      { id: 'same-line::kyushu::hakata-kurume', sLine: 'shinkansen-kyushu', sSts: ['博多', '新鳥栖', '久留米'], cLines: ['kyushu-kagoshima'], cSts: getStationNames('kyushu-kagoshima', '博多', '久留米') },
      { id: 'same-line::kyushu::kurume-chikugofunagoya', sLine: 'shinkansen-kyushu', sSts: ['久留米', '筑後船小屋'], cLines: ['kyushu-kagoshima'], cSts: getStationNames('kyushu-kagoshima', '久留米', '筑後船小屋') },
      { id: 'same-line::kyushu::chikugofunagoya-kumamoto', sLine: 'shinkansen-kyushu', sSts: ['筑後船小屋', '新大牟田', '新玉名', '熊本'], cLines: ['kyushu-kagoshima'], cSts: getStationNames('kyushu-kagoshima', '筑後船小屋', '熊本') },
      { id: 'same-line::kyushu::kumamoto-shinyatsushiro', sLine: 'shinkansen-kyushu', sSts: ['熊本', '新八代'], cLines: ['kyushu-kagoshima'], cSts: getStationNames('kyushu-kagoshima', '熊本', '新八代') }
    ];

    CACHED_PARALLEL_CORRIDORS = corridorDefs.map(def => ({
      id: def.id,
      shinkansenLine: def.sLine,
      shinkansenStations: new Set(def.sSts),
      conventionalLines: new Set(def.cLines),
      conventionalStations: new Set(def.cSts)
    }));

    return CACHED_PARALLEL_CORRIDORS;
  }

  // マルチストップルート探索メインAPI
  function searchMarsRoute(...args) {
    let graph, tracks, stations, stops, options;
    let deptId, destId, viaIds = [];

    if (typeof args[0] === 'string') {
      deptId = args[0];
      viaIds = Array.isArray(args[1]) ? args[1] : (args[1] ? [args[1]] : []);
      destId = args[2];
      options = args[3] || {};
      stops = [deptId, ...viaIds, destId];

      if (options.stations && options.lines) {
        buildGraph(options.stations, options.lines);
      } else if (!cachedGraph) {
        buildGraph();
      }
      graph = cachedGraph;
      stations = cachedStations || options.stations || (typeof window !== 'undefined' ? window.JR_STATIONS : {}) || {};
      tracks = (typeof window !== 'undefined' ? window.JR_TRACKS : null);
    } else {
      graph = args[0];
      tracks = args[1];
      stations = args[2];
      stops = args[3] || [];
      options = args[4] || {};
      deptId = stops[0];
      destId = stops[stops.length - 1];
      viaIds = stops.slice(1, -1);
    }

    if (!stops || stops.length < 2) {
      return { success: false, error: '発駅と着駅を指定してください。' };
    }

    const rawStops = [...stops];

    // 新幹線特定区間の探索設定
    const shinkansenSegs = options.shinkansenSegments || [];
    const forceShinkansenOnly = !!options.forceShinkansenOnlyInSegments;

    // 新幹線指定区間を stops に自動統合
    stops = expandStopsWithShinkansen(stops, shinkansenSegs, stations);

    const searchMode = options.searchMode || options.mode || 'shortest';
    const requireOneWay = (searchMode === 'oneway');

    const fullSegments = [];
    const visitedStations = new Set();
    let hasDuplicate = false;

    // 一周ルート (発着同一駅) の判定
    const isLoopRoute = (stops.length >= 2 && stops[0] === stops[stops.length - 1]);

    for (let i = 0; i < stops.length - 1; i++) {
      const origin = stops[i];
      const destination = stops[i + 1];

      // このレグが新幹線指定区間かどうか判定 (順方向一致を優先)
      const oSt = stations[origin];
      const dSt = stations[destination];
      const oName = oSt ? oSt.name : origin;
      const dName = dSt ? dSt.name : destination;

      let isThisLegShinkansen = false;
      if (shinkansenSegs && shinkansenSegs.length > 0) {
        isThisLegShinkansen = shinkansenSegs.some(seg => {
          const fromSt = resolveStation(seg.fromId, seg.from || seg.fromName, stops, stations);
          const toSt = resolveStation(seg.toId, seg.to || seg.toName, stops, stations);
          const fId = fromSt ? fromSt.id : seg.fromId;
          const tId = toSt ? toSt.id : seg.toId;
          const fName = fromSt ? fromSt.name : (seg.fromName || seg.from);
          const tName = toSt ? toSt.name : (seg.toName || seg.to);

          return (origin === fId || oName === fName) && (destination === tId || dName === tName);
        });

        // 順方向がない場合のみ単一レグで逆方向も許容
        if (!isThisLegShinkansen && stops.length === 2) {
          isThisLegShinkansen = shinkansenSegs.some(seg => {
            const fromSt = resolveStation(seg.fromId, seg.from || seg.fromName, stops, stations);
            const toSt = resolveStation(seg.toId, seg.to || seg.toName, stops, stations);
            const fId = fromSt ? fromSt.id : seg.fromId;
            const tId = toSt ? toSt.id : seg.toId;
            const fName = fromSt ? fromSt.name : (seg.fromName || seg.from);
            const tName = toSt ? toSt.name : (seg.toName || seg.to);
            return (origin === tId || oName === tName) && (destination === fId || dName === fName);
          });
        }
      }

      let legAllowShinkansen = (options.useShinkansen !== undefined) ? options.useShinkansen : (options.allowShinkansen !== false);
      let legForceShinkansen = false;

      if (isThisLegShinkansen) {
        legAllowShinkansen = true;
        legForceShinkansen = true;
      } else if (shinkansenSegs && shinkansenSegs.length > 0) {
        // 特定区間のみ新幹線指定されている場合、未指定レグは新幹線を使用しない
        legAllowShinkansen = false;
      } else if (forceShinkansenOnly) {
        legAllowShinkansen = false;
      }

      let leg = null;
      // 東海道新幹線など別線利用レグの場合、直前の在来線レグの通過駅が新幹線駅探索を阻害しないよう調整
      const legForbiddenStations = new Set(visitedStations);
      if (legForceShinkansen) {
        // 別線新幹線探索時は終点駅および別線接続駅を禁止対象から外す
        legForbiddenStations.delete(destination);
        legForbiddenStations.delete(origin);
      }

      if (requireOneWay) {
        // 重複区間なし（一筆書き）モード: 訪問済み駅を禁止して探索
        leg = findLeg(graph, origin, destination, {
          allowShinkansen: legAllowShinkansen,
          forceShinkansen: legForceShinkansen,
          forbiddenStations: legForbiddenStations
        });
        if (!leg && legForceShinkansen) {
          // 新幹線強制で見つからない場合のフォールバック (在来線含め再探索)
          leg = findLeg(graph, origin, destination, {
            allowShinkansen: true,
            forbiddenStations: legForbiddenStations
          });
        }
        if (!leg) {
          const originName = (stations[origin] && stations[origin].name) || origin;
          const destName = (stations[destination] && stations[destination].name) || destination;
          return {
            success: false,
            error: `「${originName}」から「${destName}」への重複区間なし（一筆書き）ルートが見つかりませんでした。「最短経路」をお試しください。`
          };
        }
      } else {
        // 最短経路モード: 禁止ノードなしで探索
        leg = findLeg(graph, origin, destination, {
          allowShinkansen: legAllowShinkansen,
          forceShinkansen: legForceShinkansen,
          forbiddenStations: new Set()
        });
        if (!leg && legForceShinkansen) {
          leg = findLeg(graph, origin, destination, {
            allowShinkansen: true,
            forbiddenStations: new Set()
          });
        }
        if (!leg) {
          const originName = (stations[origin] && stations[origin].name) || origin;
          const destName = (stations[destination] && stations[destination].name) || destination;
          return {
            success: false,
            error: `「${originName}」から「${destName}」への経路が見つかりませんでした。`
          };
        }
      }

      leg.forEach(seg => {
        fullSegments.push(seg);
        if (seg.from !== destination) {
          visitedStations.add(seg.from);
        }
        if (seg.to !== destination) {
          visitedStations.add(seg.to);
        }
      });
    }

    if (fullSegments.length === 0) {
      return { success: false, error: '有効な経路が見つかりませんでした。' };
    }

    // 旅規第16条の2 同一線扱い新幹線・並行在来線区間 Corridor 定義
    // ※東海道新幹線 (東京〜新大阪) は2026年3月改定により東海道本線と別線扱いのため含めない
    const SAME_LINE_PARALLEL_CORRIDORS = getSameLineParallelCorridors(stations, cachedLines);

    // エッジごとの通過回数集計 (無向エッジとして同一区間の往復または重複通過を検出)
    // 2026年3月改定対応:
    // - 東海道新幹線と東海道本線は別線扱いのため、乗り分け往復は「重複なし」として許可
    // - 東北新幹線と東北本線 (上野〜大宮等) は同一線扱いのため、往復時は「重複あり」として弾く
    const edgeCountMap = new Map();
    const corridorShinkansenMap = new Map();
    const corridorConventionalMap = new Map();

    const isTokaidoZairaiLine = (lid) => (lid === 'tokaido' || lid === 'tokai-tokaido' || lid === 'tokaido-west' || lid === 'tokai-minoakasaka');

    fullSegments.forEach(seg => {
      const isTkShinkansen = (seg.lineId === 'shinkansen-tokaido');
      const isTkZairai = isTokaidoZairaiLine(seg.lineId);

      // 1. 通常の物理エッジキー
      // 東海道新幹線と東海道本線は別線なので trackKey を分ける
      const trackType = isTkShinkansen ? 'tokaido-shinkansen' : 'standard';
      const idKey = seg.from < seg.to ? `${trackType}::${seg.from}::${seg.to}` : `${trackType}::${seg.to}::${seg.from}`;
      edgeCountMap.set(idKey, (edgeCountMap.get(idKey) || 0) + 1);

      const st1 = stations[seg.from];
      const st2 = stations[seg.to];
      const n1 = st1 ? st1.name : seg.from;
      const n2 = st2 ? st2.name : seg.to;
      if (n1 !== n2) {
        // 東海道新幹線と東海道本線は別線なので駅名キーも trackType を考慮
        const nameKey = n1 < n2 ? `name::${trackType}::${n1}::${n2}` : `name::${trackType}::${n2}::${n1}`;
        edgeCountMap.set(nameKey, (edgeCountMap.get(nameKey) || 0) + 1);
      }

      // 2. 同一線扱い区間 (Corridor) の集計
      SAME_LINE_PARALLEL_CORRIDORS.forEach(c => {
        if (seg.lineId === c.shinkansenLine && c.shinkansenStations.has(n1) && c.shinkansenStations.has(n2)) {
          corridorShinkansenMap.set(c.id, (corridorShinkansenMap.get(c.id) || 0) + 1);
        } else if (c.conventionalLines.has(seg.lineId) && c.conventionalStations.has(n1) && c.conventionalStations.has(n2)) {
          corridorConventionalMap.set(c.id, (corridorConventionalMap.get(c.id) || 0) + 1);
        }
      });
    });

    let hasDuplicateEdges = false;
    fullSegments.forEach(seg => {
      const isTkShinkansen = (seg.lineId === 'shinkansen-tokaido');
      const trackType = isTkShinkansen ? 'tokaido-shinkansen' : 'standard';
      const idKey = seg.from < seg.to ? `${trackType}::${seg.from}::${seg.to}` : `${trackType}::${seg.to}::${seg.from}`;
      const st1 = stations[seg.from];
      const st2 = stations[seg.to];
      const n1 = st1 ? st1.name : seg.from;
      const n2 = st2 ? st2.name : seg.to;
      const nameKey = n1 < n2 ? `name::${trackType}::${n1}::${n2}` : `name::${trackType}::${n2}::${n1}`;

      const idCount = edgeCountMap.get(idKey) || 0;
      const nameCount = (n1 !== n2) ? (edgeCountMap.get(nameKey) || 0) : idCount;

      let isCorridorDuplicate = false;
      SAME_LINE_PARALLEL_CORRIDORS.forEach(c => {
        const hasShinkansen = (corridorShinkansenMap.get(c.id) || 0) > 0;
        const hasConventional = (corridorConventionalMap.get(c.id) || 0) > 0;
        // 同一線新幹線と並行在来線の両方を通過した場合は同一線重複
        if (hasShinkansen && hasConventional) {
          if (seg.lineId === c.shinkansenLine && c.shinkansenStations.has(n1) && c.shinkansenStations.has(n2)) {
            isCorridorDuplicate = true;
          } else if (c.conventionalLines.has(seg.lineId) && c.conventionalStations.has(n1) && c.conventionalStations.has(n2)) {
            isCorridorDuplicate = true;
          }
        }
      });

      seg.isDuplicate = (idCount > 1 || nameCount > 1 || isCorridorDuplicate);
      if (seg.isDuplicate) hasDuplicateEdges = true;
    });

    // 通過全駅IDリスト
    const allStationIds = [fullSegments[0].from, ...fullSegments.map(s => s.to)];

    // 各駅の到着回数集計
    // 旅規第68条: 片道乗車券は環状線一周となるものを除き、折り返し又は同一駅を2度以上通過しないこと
    // 東海道新幹線と東海道本線は別線扱いですが、品川・小田原等の接続駅は同一駅であるため、
    // 途中で同一駅を2度通過する経路（8の字等）は重複あり（成立不可）となります。
    const arrivalCount = new Map();
    fullSegments.forEach(seg => {
      arrivalCount.set(seg.to, (arrivalCount.get(seg.to) || 0) + 1);
    });

    // 始点駅が途中で再訪問された場合も検知 (一周ルートの場合は最後のゴール到着を除外)
    const originId = stops[0];
    const intermediateSegments = isLoopRoute ? fullSegments.slice(1, -1) : fullSegments.slice(1);
    const originVisitedAgain = intermediateSegments.some(s => s.from === originId || s.to === originId);

    const duplicateStationIds = [];
    arrivalCount.forEach((cnt, id) => {
      if (isLoopRoute && id === originId) {
        if (cnt > 1) duplicateStationIds.push(id);
      } else {
        if (cnt > 1) duplicateStationIds.push(id);
      }
    });
    if (originVisitedAgain && !duplicateStationIds.includes(originId)) {
      duplicateStationIds.push(originId);
    }

    hasDuplicate = hasDuplicateEdges || (duplicateStationIds.length > 0);

    // 路線ごとの区間ラン（連続乗車区間）の圧縮集計
    // 小数点計算の誤差防止のため、0.1km単位の整数(tenths)で積算
    const lineRuns = [];
    fullSegments.forEach(seg => {
      const segTenths = Math.round(seg.dist * 10);
      if (lineRuns.length === 0 || lineRuns[lineRuns.length - 1].lineId !== seg.lineId) {
        lineRuns.push({
          lineId: seg.lineId,
          lineName: seg.lineName,
          marsName: seg.marsName,
          color: seg.color,
          isShinkansen: seg.isShinkansen,
          from: seg.from,
          to: seg.to,
          stationIds: [seg.from, seg.to],
          distTenths: segTenths,
          dist: segTenths / 10,
          hasDuplicate: !!seg.isDuplicate,
          isEstimated: !!seg.isEstimated
        });
      } else {
        const last = lineRuns[lineRuns.length - 1];
        last.to = seg.to;
        last.stationIds.push(seg.to);
        last.distTenths += segTenths;
        last.dist = last.distTenths / 10;
        if (seg.isDuplicate) last.hasDuplicate = true;
        if (seg.isEstimated) last.isEstimated = true;
      }
    });

    // 概算距離（直線距離フォールバック）の有無および未登録路線名の集計
    let hasEstimatedDistance = false;
    const unregisteredLinesSet = new Set();
    fullSegments.forEach(seg => {
      if (seg.isEstimated) {
        hasEstimatedDistance = true;
        if (seg.lineName) unregisteredLinesSet.add(seg.lineName);
      }
    });
    const unregisteredLines = Array.from(unregisteredLinesSet);

    // マルス経由線表記の生成 (例: 東海道・山手・中央東 / 新幹線区間は「上野・新幹線・大宮」等)
    const marsNamesList = [];
    for (let i = 0; i < lineRuns.length; i++) {
      const r = lineRuns[i];
      const deptSt = (stations[r.from] && stations[r.from].name) || r.from;
      const destSt = (stations[r.to] && stations[r.to].name) || r.to;

      if (r.isShinkansen) {
        // 新幹線区間: 直前がその乗車駅でなければ乗換駅を追加し、「新幹線」、降車駅を表記
        if (marsNamesList.length === 0 || marsNamesList[marsNamesList.length - 1] !== deptSt) {
          marsNamesList.push(deptSt);
        }
        marsNamesList.push('新幹線');
        marsNamesList.push(destSt);
      } else {
        // 在来線区間
        if (marsNamesList.length === 0 || marsNamesList[marsNamesList.length - 1] !== r.marsName) {
          marsNamesList.push(r.marsName);
        }
      }
    }
    const marsFormatString = marsNamesList.join('・');

    // 総距離 (0.1km単位の整数で合算してから10で割ることで浮動小数点誤差を完全防止)
    const totalDistTenths = fullSegments.reduce((sum, s) => sum + Math.round(s.dist * 10), 0);
    const totalDist = totalDistTenths / 10;

    // 線路ジオメトリの抽出 (連続する通常区間・新幹線区間・重複区間をそれぞれ1本の長い連続Polylineに連結)
    const geometryLatlngs = [];
    const normalPolylines = [];    // 通常通過区間の連続座標群 (青色用)
    const shinkansenPolylines = []; // 新幹線通過区間の連続座標群 (新幹線専用ハイライト用)
    const duplicatePolylines = []; // 重複通過区間の連続座標群 (赤色用)

    function pushPolylineChain(type, chain) {
      if (!chain || chain.length === 0) return;
      if (type === 'duplicate') duplicatePolylines.push(chain);
      else if (type === 'shinkansen') shinkansenPolylines.push(chain);
      else normalPolylines.push(chain);
    }

    if (tracks) {
      let currentChain = [];
      let currentType = null;

      for (let s = 0; s < fullSegments.length; s++) {
        const seg = fullSegments[s];
        const coords = getSegmentCoords(tracks, stations, seg.lineId, seg.from, seg.to);
        if (!coords || coords.length === 0) continue;

        // 全体ジオメトリへの追加 (スムーズ接続)
        if (geometryLatlngs.length > 0) {
          geometryLatlngs.push(...coords.slice(1));
        } else {
          geometryLatlngs.push(...coords);
        }

        const segType = seg.isDuplicate ? 'duplicate' : (seg.isShinkansen ? 'shinkansen' : 'normal');

        if (currentType === null) {
          currentType = segType;
          currentChain = [...coords];
        } else if (currentType === segType) {
          // 同一状態が連続: 駅ごとに分けないで1本の長いチェーンに連結！
          if (coords.length > 1) {
            currentChain.push(...coords.slice(1));
          } else {
            currentChain.push(...coords);
          }
        } else {
          // 通常/新幹線/重複の状態が切り替わったところで1本のPolylineとして確定
          pushPolylineChain(currentType, currentChain);
          currentType = segType;
          currentChain = [...coords];
        }
      }

      pushPolylineChain(currentType, currentChain);
    }

    // フォールバック: tracks がない、またはジオメトリ抽出できなかった場合は駅間座標を連続連結
    if (geometryLatlngs.length === 0) {
      allStationIds.forEach(stId => {
        const st = stations[stId];
        if (st) geometryLatlngs.push([st.lat, st.lng]);
      });

      let currentChain = [];
      let currentType = null;

      for (let s = 0; s < fullSegments.length; s++) {
        const seg = fullSegments[s];
        const st1 = stations[seg.from];
        const st2 = stations[seg.to];
        if (!st1 || !st2) continue;

        const coords = [[st1.lat, st1.lng], [st2.lat, st2.lng]];
        const segType = seg.isDuplicate ? 'duplicate' : (seg.isShinkansen ? 'shinkansen' : 'normal');

        if (currentType === null) {
          currentType = segType;
          currentChain = [...coords];
        } else if (currentType === segType) {
          currentChain.push(coords[1]);
        } else {
          pushPolylineChain(currentType, currentChain);
          currentType = segType;
          currentChain = [...coords];
        }
      }

      pushPolylineChain(currentType, currentChain);
    }

    // UI用セクション一覧
    const sections = lineRuns.map(r => ({
      lineId: r.lineId,
      lineName: r.lineName,
      marsName: r.marsName,
      lineColor: r.color,
      isShinkansen: r.isShinkansen,
      from: r.from,
      to: r.to,
      deptName: (stations[r.from] && stations[r.from].name) || r.from,
      destName: (stations[r.to] && stations[r.to].name) || r.to,
      km: Math.round(r.dist * 10) / 10,
      stationCount: r.stationIds.length,
      stations: r.stationIds,
      isDuplicate: !!r.hasDuplicate,
      isEstimated: !!r.isEstimated
    }));

    const deptName = (stations[deptId] && stations[deptId].name) || deptId;
    const destName = (stations[destId] && stations[destId].name) || destId;

    // 通過するユニークな路線IDのリスト
    const passedLineIds = Array.from(new Set(fullSegments.map(s => s.lineId)));

    // 旅規第70条特定区間 (東京付近太線区間) の駅セット
    // 山手線全駅、赤羽線 (池袋〜赤羽)、東北本線 (東京〜赤羽・尾久含む)、中央本線 (神田〜代々木)、総武本線 (御茶ノ水〜錦糸町、東京〜錦糸町)
    const RULE_70_STATION_NAMES = new Set([
      // 山手線全駅
      '東京', '有楽町', '新橋', '浜松町', '田町', '高輪ゲートウェイ', '品川', '大崎', '五反田', '目黒', '恵比寿',
      '渋谷', '原宿', '代々木', '新宿', '新大久保', '高田馬場', '目白', '池袋', '大塚', '巣鴨', '駒込', '田端',
      '西日暮里', '日暮里', '鶯谷', '上野', '御徒町', '秋葉原', '神田',
      // 赤羽線 (埼京線)
      '板橋', '十条', '赤羽',
      // 東北本線 (尾久)
      '尾久',
      // 中央本線 (神田〜代々木)
      '御茶ノ水', '水道橋', '飯田橋', '市ケ谷', '市ヶ谷', '四ツ谷', '信濃町', '千駄ケ谷', '千駄ヶ谷',
      // 総武本線 (御茶ノ水〜錦糸町、東京〜錦糸町)
      '浅草橋', '両国', '錦糸町', '新日本橋', '馬喰町'
    ]);

    // 山手線内特定区間 (旅規第70条) の最短営業キロ適用
    // 発着駅が太線区間外にあり、区間内を通過する場合、太線区間内の営業キロを在来線最短経路で計算
    let effectiveTotalKm = Math.round(totalDist * 10) / 10;
    const isInternalCheck = !!options._isInternalCheck;

    if (!isInternalCheck && deptName && destName) {
      const deptInRule70 = RULE_70_STATION_NAMES.has(deptName);
      const destInRule70 = RULE_70_STATION_NAMES.has(destName);

      // 発着駅がどちらも第70条太線区間外にある場合のみ適用
      if (!deptInRule70 && !destInRule70) {
        const allNames = allStationIds.map(id => stations[id] ? stations[id].name : id);
        let firstIdx = -1;
        let lastIdx = -1;
        for (let i = 0; i < allNames.length; i++) {
          if (RULE_70_STATION_NAMES.has(allNames[i])) {
            if (firstIdx === -1) firstIdx = i;
            lastIdx = i;
          }
        }

        if (firstIdx !== -1 && lastIdx !== -1 && firstIdx !== lastIdx) {
          let entryStId = allStationIds[firstIdx];
          let exitStId = allStationIds[lastIdx];

          // 東北・上越新幹線通過時（大宮 ↔ 上野/東京）の赤羽境界補正
          // 東海道新幹線（shinkansen-tokaido）は旅規第70条注記により太線区間から除外されるため補正しない
          const akabaneSt = Object.values(stations).find(s => s && s.name === '赤羽');
          const akabaneId = akabaneSt ? akabaneSt.id : null;

          if (akabaneId) {
            if (firstIdx > 0 && allNames[firstIdx - 1] === '大宮') {
              entryStId = akabaneId;
            }
            if (lastIdx < allNames.length - 1 && allNames[lastIdx + 1] === '大宮') {
              exitStId = akabaneId;
            }
          }

          if (entryStId !== exitStId) {
            // entryStId 〜 exitStId 間を findLeg で動的に在来線最短計算
            let shortestKm = 0;
            try {
              const shortestLeg = findLeg(graph, entryStId, exitStId, { allowShinkansen: false, useShinkansen: false });
              if (shortestLeg && shortestLeg.length > 0) {
                const sTenths = shortestLeg.reduce((sum, seg) => sum + Math.round(seg.dist * 10), 0);
                shortestKm = sTenths / 10;
              }
            } catch (e) {
              console.warn('Rule 70 dynamic shortest calculation failed:', e);
            }

            if (shortestKm > 0) {
              // 太線区間内の実際の乗車キロを集計 (東海道新幹線は旅規第70条注記により除外)
              let actualInZoneTenths = 0;
              for (let s = 0; s < fullSegments.length; s++) {
                const seg = fullSegments[s];
                const sFrom = stations[seg.from] ? stations[seg.from].name : seg.from;
                const sTo = stations[seg.to] ? stations[seg.to].name : seg.to;

                // 東海道新幹線（shinkansen-tokaido）は第70条対象外
                if (seg.lineId === 'shinkansen-tokaido' || seg.lineName === '東海道新幹線') {
                  continue;
                }

                if (seg.isShinkansen) {
                  // 東北・上越新幹線の場合: 東京〜大宮は赤羽までの13.2km、上野〜大宮は赤羽までの9.6kmを区間内とする
                  if ((sFrom === '東京' && sTo === '大宮') || (sFrom === '大宮' && sTo === '東京')) {
                    actualInZoneTenths += 132; // 東京〜赤羽 13.2km
                  } else if ((sFrom === '上野' && sTo === '大宮') || (sFrom === '大宮' && sTo === '上野')) {
                    actualInZoneTenths += 96;  // 上野〜赤羽 9.6km
                  } else if (RULE_70_STATION_NAMES.has(sFrom) && RULE_70_STATION_NAMES.has(sTo)) {
                    actualInZoneTenths += Math.round(seg.dist * 10);
                  }
                } else {
                  if (RULE_70_STATION_NAMES.has(sFrom) && RULE_70_STATION_NAMES.has(sTo)) {
                    actualInZoneTenths += Math.round(seg.dist * 10);
                  }
                }
              }

              const actualInZoneKm = actualInZoneTenths / 10;
              if (shortestKm < actualInZoneKm) {
                const diffKm = Math.round((actualInZoneKm - shortestKm) * 10) / 10;
                effectiveTotalKm = Math.round((totalDist - diffKm) * 10) / 10;
              }
            }
          }
        }
      }
    }

    // 発着駅間の直接最短営業キロ (大都市近郊区間の運賃計算特例用)
    let directShortestKm = effectiveTotalKm;
    if (deptId === destId) {
      directShortestKm = 0.0;
    } else {
      try {
        const directLeg = findLeg(graph, deptId, destId, {
          allowShinkansen: false,
          useShinkansen: false
        });
        if (directLeg && directLeg.length > 0) {
          const directTenths = directLeg.reduce((sum, seg) => sum + Math.round(seg.dist * 10), 0);
          directShortestKm = directTenths / 10;
        }
      } catch (e) {
        console.warn('Direct leg calculation failed:', e);
      }
    }

    // 運賃・途中下車・有効期間等のJR旅客営業規則判定
    let fareRules = null;
    let fareMod = null;
    if (typeof window !== 'undefined' && window.JR_FARE_ENGINE) {
      fareMod = window.JR_FARE_ENGINE;
    } else if (typeof require !== 'undefined') {
      try {
        fareMod = require('./fare-engine.js');
      } catch (e) {}
    }
    if (fareMod && fareMod.evaluateRouteFareAndRules) {
      fareRules = fareMod.evaluateRouteFareAndRules({
        totalKm: effectiveTotalKm,
        directShortestKm: directShortestKm,
        sections: sections,
        fullSegments: fullSegments,
        deptId: deptId,
        destId: destId,
        deptName: deptName,
        destName: destName,
        allStationIds: allStationIds,
        lineRuns: lineRuns,
        stops: stops,
        graph: graph,
        success: true
      }, stations, cachedLines || [], options);
    }

    return {
      success: true,
      deptId: deptId,
      destId: destId,
      deptName: deptName,
      destName: destName,
      viaIds: viaIds,
      marsString: marsFormatString,
      totalKm: effectiveTotalKm,
      directShortestKm: directShortestKm,
      actualKm: Math.round(totalDist * 10) / 10,
      hasEstimatedDistance: hasEstimatedDistance,
      unregisteredLines: unregisteredLines,
      isOneWayTrip: !hasDuplicate,
      isLoopRoute: isLoopRoute,
      fareRules: fareRules,
      sections: sections,
      geometryLatlngs: geometryLatlngs,
      normalPolylines: normalPolylines,
      shinkansenPolylines: shinkansenPolylines,
      duplicatePolylines: duplicatePolylines,
      passedLineIds: passedLineIds,

      // 従来互換フィールド
      isOneWay: !hasDuplicate,
      stops: stops,
      marsFormat: marsFormatString,
      marsNamesList: marsNamesList,
      totalDist: effectiveTotalKm,
      lineRuns: lineRuns,
      allStationIds: allStationIds,
      duplicateStationIds: duplicateStationIds
    };
  }

  // グローバルエクスポート
  const RouteEngine = {
    MARS_LINE_NAMES,
    getMarsLineName,
    buildGraph,
    findLeg,
    getSegmentCoords,
    searchMarsRoute
  };

  if (typeof window !== 'undefined') {
    window.JR_ROUTE_ENGINE = RouteEngine;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = RouteEngine;
  }
})();
