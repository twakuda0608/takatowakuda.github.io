/**
 * JR Route Engine & MARS Route Generator
 * マルス経由線名算出 & 一筆書き・最短経路探索エンジン
 */
(function() {
  // 1. マルス路線名辞書 (JR旅客営業規則・マルス経由線略称・kiha54500準拠)
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
    'shinkansen-akita': '田沢湖線',

    // 関東・東日本主要幹線
    'yamanote': '山手',
    'tokaido': '東海道',
    'chuo-main': '中央東',
    'chuo-tatsuno': '中央２',
    'tokai-chuo': '中央西',
    'sobu-main': '総武',
    'tohoku-main': '東北',
    'joban': '常磐',
    'takasaki-line': '高崎線',
    'joetsu-line': '上越',
    'shinetsu-line': '信越',
    'shinetsu-takasaki': '信越',
    'shinonoi-line': '篠ノ井線',
    'negishi-line': '根岸線',
    'yokohama-line': '横浜線',
    'nambu': '南武',
    'tsurumi-line': '鶴見線',
    'musashino': '武蔵野',
    'keiyo': '京葉',
    'akabane-line': '赤羽線',
    'yokosuka-line': '横須賀線',
    'sagami': '相模',
    'ito-line': '伊東線',
    'ome-line': '青梅線',
    'itsukaichi-line': '五日市線',
    'hachiko-line': '八高',
    'kawagoe-line': '川越線',
    'ryomo-line': '両毛',
    'mito-line': '水戸線',
    'nikko-line': '日光線',
    'karasuyama-line': '烏山線',
    'agatsuma-line': '吾妻',
    'uchibo-line': '内房',
    'sotobo-line': '外房',
    'narita-line': '成田線',
    'kashima-line': '鹿島',
    'kururi-line': '久留里線',
    'togane-line': '東金線',
    'suigun-line': '水郡',

    // 東北・甲信越
    'banetsu-west': '磐越西',
    'banetsu-east': '磐越東',
    'ou-main': '奥羽',
    'uetsu-main': '羽越',
    'senzan-line': '仙山',
    'senseki-line': '仙石',
    'ishinomaki-line': '石巻線',
    'ofunato-line': '大船渡線',
    'kamaishi-line': '釜石線',
    'yamada-line': '山田',
    'hachinohe-line': '八戸線',
    'hanawa-line': '花輪',
    'kitakami-line': '北上線',
    'tazawako-line': '田沢湖線',
    'tsugaru-line': '津軽',
    'ominato-line': '大湊線',
    'gonou-line': '五能',
    'oga-line': '男鹿線',
    'rikuuto-line': '陸羽東',
    'rikuusai-line': '陸羽西',
    'yonesaka-line': '米坂',
    'aterazawa-line': '左沢線',
    'tadami-line': '只見線',
    'echigo-line': '越後',
    'yahiko-line': '弥彦線',
    'hakushin-line': '白新',
    'iiyama-line': '飯山線',
    'oito-line': '大糸',
    'oito-west': '大糸',
    'koumi-line': '小海線',

    // 東海
    'tokai-tokaido': '東海道',
    'tokai-minoakasaka': '東海道',
    'tokai-kansai': '関西',
    'tokai-kisei': '紀勢',
    'tokai-takayama': '高山線',
    'takayama-west': '高山線',
    'tokai-iida': '飯田線',
    'tokai-minobu': '身延線',
    'tokai-gotemba': '御殿場線',
    'tokai-taketoyo': '武豊線',
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
    'osaka-loop': '大阪環状',
    'jr-tozai': 'ＪＲ東西',
    'fukuchiyama-line': '福知山線',
    'hanwa-line': '阪和',
    'kansai-west': '関西',
    'nara-line': '奈良線',
    'hokuriku-main': '北陸',
    'kosei-line': '湖西',
    'kusatsu-line': '草津線',
    'kisei-west': '紀勢',
    'wakayama-line': '和歌山線',
    'sakurai-line': '桜井線',
    'kanku-line': '関西空港線',
    'katamachi-line': '片町線',
    'osaka-higashi': 'おおさか東',
    'bantan-line': '播但',
    'maizuru-line': '舞鶴',
    'hakubi-line': '伯備',
    'kishin-line': '姫新',
    'tsuyama-line': '津山線',
    'kibi-line': '吉備',
    'uno-line': '宇野線',
    'seto-ohashi-west': '本四備讃',
    'akaho-line': '赤穂',
    'ako-line': '赤穂',
    'geibi-line': '芸備',
    'fukuen-line': '福塩',
    'kure-line': '呉線',
    'kabe-line': '可部線',
    'gantoku-line': '岩徳線',
    'yamaguchi-line': '山口線',
    'mine-line': '美祢線',
    'ube-line': '宇部線',
    'onoda-line': '小野田線',
    'inbi-line': '因美',
    'imbi-line': '因美',
    'sakai-line': '境',
    'kisuki-line': '木次線',
    'kakogawa-line': '加古川線',
    'etsumihoku-line': '越美北',
    'obama-line': '小浜線',
    'nanao-line': '七尾線',
    'johana-line': '城端線',
    'himi-line': '氷見線',
    'sakurajima-line': '桜島線',

    // 四国
    'shikoku-yosan': '予讃',
    'shikoku-yosan-new': '予讃',
    'shikoku-dosan': '土讃',
    'shikoku-kotoku': '高徳',
    'shikoku-tokushima': '徳島線',
    'shikoku-naruto': '鳴門線',
    'shikoku-mugi': '牟岐線',
    'shikoku-yodo': '予土',
    'shikoku-uchiko': '内子線',
    'shikoku-seto-ohashi': '本四備讃',

    // 九州
    'kyushu-kagoshima': '鹿児島線',
    'kyushu-nippo': '日豊',
    'kyushu-sanyo': '山陽',
    'kyushu-nagasaki': '長崎線',
    'kyushu-nagasaki-nagayo': '長崎線',
    'kyushu-sasebo': '佐世保線',
    'kyushu-omura': '大村線',
    'kyushu-kyudai': '久大',
    'kyushu-hohi': '豊肥',
    'kyushu-misumi': '三角線',
    'kyushu-hisatsu': '肥薩',
    'kyushu-kitto': '吉都',
    'kyushu-nichinan': '日南',
    'kyushu-miyazaki-kuko': '宮崎空港線',
    'kyushu-miyazaki-airport': '宮崎空港線',
    'kyushu-ibusuki': '指宿枕崎',
    'kyushu-chikuhi': '筑肥',
    'kyushu-karatsu': '唐津線',
    'kyushu-chikuho': '筑豊',
    'kyushu-sasaguri': '篠栗線',
    'kyushu-gotoji': '後藤寺線',
    'kyushu-kashii': '香椎線',
    'kyushu-hitahikosan': '日田彦山',
    'hakataminami-line': '博多南線',

    // 北海道
    'hokkaido-hakodate': '函館線',
    'hokkaido-hakodate-sawara': '函館線',
    'hokkaido-chitose': '千歳線',
    'hokkaido-chitose-airport': '千歳線',
    'hokkaido-muroran': '室蘭線',
    'hokkaido-muroran-branch': '室蘭線',
    'hokkaido-sekisho': '石勝',
    'hokkaido-nemuro': '根室線',
    'hokkaido-furano': '富良野線',
    'hokkaido-soya': '宗谷',
    'hokkaido-sekihoku': '石北',
    'hokkaido-senmo': '釧網',
    'hokkaido-sassho': '札沼',
    'hokkaido-rumoi': '留萌線',
    'hokkaido-hidaka': '日高',
    'hokkaido-kaikyo': '海峡'
  };

  // 1-2. マルス券面・同名駅正式略号マスタ (全国JR全同名駅対応)
  const MARS_DUPLICATE_STATION_MAP = {
    // 旭
    'st-k4t': '(総)旭',
    'st-k4t-1': '(土)旭',
    // 入野
    'st-en7t-1': '(陽)入野',
    'st-en7t': '(指)入野',
    // 追分
    'oiwake': '(奥)追分',
    'st-oxwp': '(室)追分',
    // 大久保
    'okubo': '(中)大久保',
    'st-dfulb': '(陽)大久保',
    'st-dfulb-1': '(奥)大久保',
    // 大河原
    'st-dl1o3': '(北)大河原',
    'st-dl1o3-1': '(関)大河原',
    // 大沢
    'st-frdn': '(奥)大沢',
    'st-frdn-1': '(上)大沢',
    // 大町
    'st-ft2r': '(佐世)大町',
    'st-ft2r-1': '(可)大町',
    // 小野
    'st-ggin': '(中)小野',
    'st-ggin-1': '(湖)小野',
    // 柏原
    'st-i46o': '(関)柏原',
    'st-i46o-1': '(福)柏原',
    'st-i46o-2': '(東)柏原',
    // 桂川
    'st-i8yj-1': '(東)桂川',
    'st-i8yj': '(筑)桂川',
    // 加茂
    'st-ertu': '(信)加茂',
    'st-ertu-1': '(関)加茂',
    // 川内
    'st-gevc': '(山)川内',
    'st-gevc-1': '(鹿)川内',
    // 神代
    'st-l2rp': '(田沢)神代',
    'st-l2rp-1': '(陽)神代',
    // 黒井
    'st-rg1v': '(信)黒井',
    'st-rg1v-1': '(福)黒井',
    // 国分
    'st-f8vd-1': '(讃)国分',
    'st-f8vd': '(豊)国分',
    // 小林
    'st-g86g': '(成)小林',
    'st-g86g-1': '(吉)小林',
    // 郡山
    'koriyama': '(北)郡山',
    'st-p5f4': '(関)郡山',
    'p5f4': '(関)郡山',
    // 西条
    'st-nyde': '(篠)西条',
    'st-nyde-1': '(陽)西条',
    // 三川
    'st-dsdw': '(磐)三川',
    'st-dsdw-1': '(室)三川',
    // 三郷
    'misato': '(武蔵)三郷',
    'st-e2ha': '(関)三郷',
    // 島田
    'st-gge2-1': '(東)島田',
    'st-gge2': '(陽)島田',
    // 下松
    'st-duc3': '(阪)下松',
    'st-duc3-1': '(陽)下松',
    // 白石
    'st-kt92': '(北)白石',
    'st-kt92-2': '(函)白石',
    'st-kt92-1': '(肥)白石',
    // 白沢
    'st-kr0l': '(奥)白沢',
    'st-kr0l-1': '(指)白沢',
    // 新田
    'st-hxts': '(北)新田',
    'st-hxts-1': '(奈)新田',
    // 新富士
    'shin-fuji': '(東)新富士',
    'st-fcaq7': '(根)新富士',
    // 新野
    'st-i3ha-1': '(播)新野',
    'st-i3ha': '(牟)新野',
    // 住吉
    'st-dy8q-1': '(東)住吉',
    'st-dy8q': '(三)住吉',
    // 瀬田
    'st-jq10-1': '(東)瀬田',
    'st-jq10': '(豊肥)瀬田',
    // 草野
    'st-n4px': '(常)草野',
    'st-n4px-1': '(福)草野',
    // 高田
    'st-qzbs-1': '(和)高田',
    'st-qzbs': '(長)高田',
    // 高瀬
    'st-qyc4': '(仙山)高瀬',
    'st-qyc4-1': '(讃)高瀬',
    // 高松
    'st-qwme-1': '(七)高松',
    'st-qwme': '(讃)高松',
    // 滝
    'st-lwd': '(烏)滝',
    'st-lwd-1': '(加)滝',
    // 千歳
    'st-er2o': '(房)千歳',
    'st-er2o-1': '(千)千歳',
    // 中田
    'st-dxur': '(能)中田',
    'st-dxur-1': '(牟)中田',
    // 戸田
    'toda': '(北)戸田',
    'st-hcl4': '(陽)戸田',
    // 富田
    'st-g99g': '(両)富田',
    'st-g99g-1': '(関)富田',
    // 富浦
    'st-g7q2': '(房)富浦',
    'st-g7q2-1': '(室)富浦',
    // 仁井田
    'st-bx9z0': '(烏)仁井田',
    'st-bx9z0-1': '(土)仁井田',
    // 日進
    'nisshin': '(川)日進',
    'st-i4fh': '(宗)日進',
    // 根岸
    'negishi': '(岸)根岸',
    'st-i8in': '(只)根岸',
    // 野崎
    'st-pb7k': '(北)野崎',
    'st-pb7k-1': '(片)野崎',
    // 橋本
    'hashimoto': '(横)橋本',
    'st-in9d': '(和)橋本',
    // 広野
    'st-gvjf': '(常)広野',
    'st-gvjf-1': '(福)広野',
    // 福島
    'fukushima': '(北)福島',
    'st-l6pz': '(環)福島',
    // 府中
    'st-gis1-1': '(塩)府中',
    'st-gis1': '(徳)府中',
    // 船岡
    'st-mnpk': '(北)船岡',
    'st-mnpk-1': '(陰)船岡',
    // 上道
    'st-e2dl-1': '(陽)上道',
    'st-e2dl': '(境)上道',
    // 柳原
    'st-i51o': '(北上)柳原',
    'st-i51o-1': '(讃)柳原',
    // 山崎
    'st-g8fx': '(東)山崎',
    'st-g8fx-1': '(函)山崎',
    // 横川
    'st-ikmr': '(信)横川',
    'st-ikmr-1': '(陽)横川',
    // 吉富
    'st-espv': '(豊)吉富',
    'st-espv-1': '(陰)吉富',
    // 荒尾
    'st-mucs-1': '(東)荒尾',
    'mucs-1': '(東)荒尾',
    'st-mucs': '(鹿)荒尾',
    'mucs': '(鹿)荒尾'
  };

  function getMarsStationName(stOrId, stations) {
    if (!stOrId) return '';
    const id = typeof stOrId === 'string' ? stOrId : stOrId.id;
    if (id && MARS_DUPLICATE_STATION_MAP[id]) {
      return MARS_DUPLICATE_STATION_MAP[id];
    }
    const st = (stations && stations[id]) || (typeof stOrId === 'object' ? stOrId : null);
    return st ? st.name : id;
  }

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

    // 共用新幹線区間（東北・上越新幹線と重複する東京側区間）の除外駅マップ
    // 秋田新幹線: 盛岡以南（東京〜盛岡）を除外（盛岡〜秋田間のみエッジ化）
    // 山形新幹線: 福島以南（東京〜福島）を除外（福島〜新庄間のみエッジ化）
    // 上越新幹線: 大宮以南（東京〜大宮）を除外（大宮〜新潟間のみエッジ化）
    // 北陸新幹線: 高崎以南（東京〜高崎）を除外（高崎〜敦賀間のみエッジ化）
    const SHARED_SHINKANSEN_EXCLUDE_STATIONS = {
      'shinkansen-akita': new Set(['tokyo', 'ueno', 'omiya', 'sendai']),
      'shinkansen-yamagata': new Set(['tokyo', 'ueno', 'omiya', 'utsunomiya', 'koriyama']),
      'shinkansen-joetsu': new Set(['tokyo', 'ueno']),
      'shinkansen-hokuriku': new Set(['tokyo', 'ueno', 'omiya', 'kumagaya', 'honjowaseda'])
    };

    lines.forEach(line => {
      const isShinkansen = line.category === 'shinkansen';
      const marsName = getMarsLineName(line);
      const chains = [line.stations, ...(line.branches || [])];

      chains.forEach((stIds, chainIdx) => {
        if (!stIds || !Array.isArray(stIds)) return;
        const isBranch = (chainIdx > 0);
        for (let i = 0; i < stIds.length - 1; i++) {
          const u = stIds[i];
          const v = stIds[i + 1];
          const stU = stations[u];
          const stV = stations[v];
          if (!stU || !stV) continue;

          // 共用新幹線区間の重複・スキップエッジを除外 (東北・上越新幹線側を使用)
          const excludeSet = SHARED_SHINKANSEN_EXCLUDE_STATIONS[line.id];
          if (excludeSet && (excludeSet.has(u) || excludeSet.has(v))) {
            continue;
          }

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
            isEstimated: isEstimated,
            isBranch: isBranch
          });

          adj.get(v).push({
            to: u,
            lineId: line.id,
            lineName: line.name,
            marsName: marsName,
            color: line.color || '#0070c0',
            isShinkansen: isShinkansen,
            dist: dist,
            isEstimated: isEstimated,
            isBranch: isBranch
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
    CACHED_PARALLEL_CORRIDORS = null;
    CACHED_PARALLEL_EDGE_MAP = null;

    return adj;
  }

  // 2026年3月14日改定: 東海道新幹線（東京〜熱海間）および山陽新幹線（新下関〜博多間）は並行在来線と完全別線
  const TOKAIDO_SHINKANSEN_SEPARATE_STATIONS = new Set(['tokyo', 'shinagawa', 'shin-yokohama', 'odawara', 'atami']);
  const SANYO_SHINKANSEN_SEPARATE_STATIONS = new Set(['shin-shimonoseki', 'kokura', 'hakata']);
  const TOKAIDO_CONV_SEPARATE_NAMES = new Set([
    '東京', '有楽町', '新橋', '浜松町', '田町', '高輪ゲートウェイ', '品川',
    '大井町', '大森', '蒲田', '川崎', '鶴見', '新子安', '東神奈川', '横浜',
    '保土ケ谷', '東戸塚', '戸塚', '大船', '藤沢', '辻堂', '茅ケ崎', '平塚',
    '大磯', '二宮', '国府津', '鴨宮', '小田原', '早川', '根府川', '真鶴', '湯河原', '熱海',
    '西大井', '武蔵小杉', '新川崎'
  ]);
  const SANYO_CONV_SEPARATE_NAMES = new Set([
    '新下関', '幡生', '下関', '門司港', '小森江', '門司', '小倉', '西小倉',
    '九州工大前', '戸畑', '枝光', 'スペースワールド', '八幡', '黒崎', '陣原', '折尾',
    '水巻', '遠賀川', '海老津', '教育大前', '赤間', '東郷', '東福間', '福間',
    '千鳥', '古賀', 'ししぶ', '新宮中央', '福工大前', '九産大前', '香椎', '千早',
    '箱崎', '吉塚', '博多'
  ]);

  function isSeparateShinkansen(seg) {
    if (!seg) return false;
    const f = seg.from || seg.fromId;
    const t = seg.to || seg.toId;
    if (seg.lineId === 'shinkansen-tokaido' &&
      TOKAIDO_SHINKANSEN_SEPARATE_STATIONS.has(f) &&
      TOKAIDO_SHINKANSEN_SEPARATE_STATIONS.has(t)) {
      return true;
    }
    if (seg.lineId === 'shinkansen-sanyo' &&
      SANYO_SHINKANSEN_SEPARATE_STATIONS.has(f) &&
      SANYO_SHINKANSEN_SEPARATE_STATIONS.has(t)) {
      return true;
    }
    return false;
  }

  function getSeparateShinkansenTrackType(seg) {
    if (!seg) return null;
    const f = seg.from || seg.fromId;
    const t = seg.to || seg.toId;
    if (seg.lineId === 'shinkansen-tokaido' &&
      TOKAIDO_SHINKANSEN_SEPARATE_STATIONS.has(f) &&
      TOKAIDO_SHINKANSEN_SEPARATE_STATIONS.has(t)) {
      return 'tokaido-shinkansen';
    }
    if (seg.lineId === 'shinkansen-sanyo' &&
      SANYO_SHINKANSEN_SEPARATE_STATIONS.has(f) &&
      SANYO_SHINKANSEN_SEPARATE_STATIONS.has(t)) {
      return 'sanyo-shinkansen-west';
    }
    return null;
  }

  function isTokaidoSeparateShinkansen(seg) {
    return isSeparateShinkansen(seg);
  }

  // 優先度キュー (MinHeap: item.d 昇順)
  class MinHeap {
    constructor() { this.heap = []; }
    push(item) {
      this.heap.push(item);
      this._bubbleUp(this.heap.length - 1);
    }
    pop() {
      if (this.heap.length === 0) return null;
      const top = this.heap[0];
      const bottom = this.heap.pop();
      if (this.heap.length > 0) {
        this.heap[0] = bottom;
        this._sinkDown(0);
      }
      return top;
    }
    size() { return this.heap.length; }
    _bubbleUp(i) {
      while (i > 0) {
        const p = (i - 1) >> 1;
        if (this.heap[i].d < this.heap[p].d) {
          [this.heap[i], this.heap[p]] = [this.heap[p], this.heap[i]];
          i = p;
        } else break;
      }
    }
    _sinkDown(i) {
      const len = this.heap.length;
      while (true) {
        let left = (i << 1) + 1;
        let right = left + 1;
        let smallest = i;
        if (left < len && this.heap[left].d < this.heap[smallest].d) smallest = left;
        if (right < len && this.heap[right].d < this.heap[smallest].d) smallest = right;
        if (smallest !== i) {
          [this.heap[i], this.heap[smallest]] = [this.heap[smallest], this.heap[i]];
          i = smallest;
        } else break;
      }
    }
  }

  // 単一レグ探索 (状態空間ダイクストラ法: stationId + marsName)
  function findLeg(graph, startId, endId, options = {}) {
    const allowShinkansen = (options.useShinkansen !== undefined) ? options.useShinkansen : (options.allowShinkansen !== false);
    const forbiddenStations = options.forbiddenStations || new Set();

    const dist = new Map();
    const prev = new Map();
    const pq = new MinHeap();
    pq.push({ id: startId, marsName: '', isShinkansen: false, d: 0 });
    dist.set(startId + '::', 0);

    const parallelEdgeMap = options.requireOneWay ? getSameLineParallelEdgeMap(cachedStations, cachedLines) : null;

    let bestEndState = null;

    while (pq.size() > 0) {
      const curr = pq.pop();
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
        if (forbiddenStations.has(edge.to)) {
          // 新幹線エッジの通過は、在来線側の将来駅制約等でブロックしない（新幹線で途中駅を通過後、在来線で同じ駅に接続した際に8の字交差として正しく重複検知するため）
          if (!edge.isShinkansen) {
            if (edge.to !== endId || options.strictForbiddenEnd) continue;
          }
        }
        if (options.forbiddenLines && options.forbiddenLines.has(edge.lineId)) continue;
        if (options.forbiddenEdges) {
          const eKey1 = curr.id + '::' + edge.to;
          const eKey2 = edge.to + '::' + curr.id;
          if (options.forbiddenEdges.has(eKey1) || options.forbiddenEdges.has(eKey2)) continue;
        }

        // 単一レグ探索における自己交差（ノードループ・8の字）防止
        if (options.requireOneWay) {
          let hasLoop = false;
          let checkKey = currKey;
          while (checkKey) {
            const p = prev.get(checkKey);
            if (!p) break;
            if (p.fromId === edge.to) {
              hasLoop = true;
              break;
            }
            checkKey = p.fromId + '::' + p.fromMars;
          }
          if (hasLoop) continue;
        }

        // 単一レグ探索における原則同一線コリドー（isParagraph2 === false）の同レグ内折り返し禁止
        // （例：米原〜京都の新幹線を利用後に京都〜山科の在来線へ折り返すなどの並行逆走を抑止）
        if (options.requireOneWay && parallelEdgeMap) {
          const stU = (cachedStations && cachedStations[curr.id]) || (typeof window !== 'undefined' && window.JR_STATIONS && window.JR_STATIONS[curr.id]);
          const stV = (cachedStations && cachedStations[edge.to]) || (typeof window !== 'undefined' && window.JR_STATIONS && window.JR_STATIONS[edge.to]);
          const nU = stU ? stU.name : curr.id;
          const nV = stV ? stV.name : edge.to;
          const edgeCorrKey = edge.lineId + '::' + nU + '::' + nV;
          const corrInfo = parallelEdgeMap.get(edgeCorrKey);
          if (corrInfo && !corrInfo.isParagraph2) {
            let checkKey = currKey;
            let hasOppositeSide = false;
            while (checkKey) {
              const p = prev.get(checkKey);
              if (!p) break;
              const pEdge = p.edge;
              if (pEdge) {
                const pstU = (cachedStations && cachedStations[p.fromId]) || (typeof window !== 'undefined' && window.JR_STATIONS && window.JR_STATIONS[p.fromId]);
                const pstV = (cachedStations && cachedStations[pEdge.to]) || (typeof window !== 'undefined' && window.JR_STATIONS && window.JR_STATIONS[pEdge.to]);
                const pU = pstU ? pstU.name : p.fromId;
                const pV = pstV ? pstV.name : pEdge.to;
                const pKey = pEdge.lineId + '::' + pU + '::' + pV;
                const pCorr = parallelEdgeMap.get(pKey);
                if (pCorr && pCorr.corridorId === corrInfo.corridorId && pCorr.side !== corrInfo.side) {
                  hasOppositeSide = true;
                  break;
                }
              }
              checkKey = p.fromId + '::' + p.fromMars;
            }
            if (hasOppositeSide) continue;
          }
        }

        let transferPenalty = 0;
        if (curr.marsName && (curr.marsName !== edge.marsName)) {
          if (curr.isShinkansen && !edge.isShinkansen) {
            // 新幹線→在来線の乗換ペナルティ (12.0km相当)
            // 小田原〜東神奈川のように在来線直通がある区間で、新幹線で通り越して新横浜から戻るような不自然な迂回を防止しつつ、
            // 新大阪→大阪等の最終接続では新幹線から確実に乗り継ぐ
            transferPenalty = 12.0;
          } else if (!curr.isShinkansen && edge.isShinkansen) {
            // 在来線→新幹線の乗車ペナルティ (5.0km相当)
            // 東京〜品川のような1駅だけの新幹線チョイ乗り（東京〜横浜での無駄な新幹線迂回）を抑止
            transferPenalty = 5.0;
          } else {
            // 同一距離の場合に乗り換えの少ない方を選ぶ微小タイブレーカー (0.01)
            transferPenalty = 0.01;
          }
        }

        // 純粋な営業キロベースで探索 (useShinkansen時は同距離・並行在来線に対して新幹線を優遇し、最も長い新幹線区間を選択)
        // 岩徳線（短絡差24.5km）や草津線等の在来線短絡ルートに惑わされず新幹線を通しで利用し、
        // かつ東京〜松本で長野経由大迂回を抑止し中央本線直通（235.4km）を維持するため 0.76 倍
        // 同一距離の場合は本線 (line.stations) を支線 (line.branches) より優先 (0.0001km 微小タイブレーカー)
        const branchPenalty = (!edge.isShinkansen && edge.isBranch) ? 0.0001 : 0;
        const edgeWeight = (allowShinkansen && !options.forceShinkansen && edge.isShinkansen)
          ? edge.dist * 0.76
          : edge.dist + branchPenalty;
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

  // 路線別ポリライントポロジーグラフのキャッシュ
  const lineTrackGraphCache = new Map();

  function buildLineTrackGraph(rawChains) {
    if (!rawChains || rawChains.length === 0) return null;

    const nodes = [];
    const nodeChain = [];
    const chainRanges = [];

    for (let c = 0; c < rawChains.length; c++) {
      const rawChain = rawChains[c];
      const startIdx = nodes.length;
      for (let i = 0; i < rawChain.length; i++) {
        const pt = rawChain[i];
        const normPt = pt[0] > 90 ? [pt[1], pt[0]] : [pt[0], pt[1]];
        nodes.push(normPt);
        nodeChain.push(c);
      }
      chainRanges.push({ startIdx, length: rawChain.length });
    }

    const N = nodes.length;
    const adj = Array.from({ length: N }, () => []);

    // 1. チェーン内隣接エッジ
    for (const range of chainRanges) {
      for (let i = 0; i < range.length - 1; i++) {
        const u = range.startIdx + i;
        const v = u + 1;
        const d = calcDistKm({ lat: nodes[u][0], lng: nodes[u][1] }, { lat: nodes[v][0], lng: nodes[v][1] });
        adj[u].push({ to: v, dist: d });
        adj[v].push({ to: u, dist: d });
      }
    }

    // 2. 空間グリッドによる近傍接続 (Junction: 分岐・合流・端点接続)
    const cellSize = 0.002;
    const grid = new Map();

    function gridKey(lat, lng) {
      const gx = Math.floor(lat / cellSize);
      const gy = Math.floor(lng / cellSize);
      return `${gx},${gy}`;
    }

    for (let i = 0; i < N; i++) {
      const k = gridKey(nodes[i][0], nodes[i][1]);
      if (!grid.has(k)) grid.set(k, []);
      grid.get(k).push(i);
    }

    const connectedPairs = new Set();
    function addJunctionEdge(u, v, d) {
      const key = u < v ? `${u}-${v}` : `${v}-${u}`;
      if (connectedPairs.has(key)) return;
      connectedPairs.add(key);
      adj[u].push({ to: v, dist: d });
      adj[v].push({ to: u, dist: d });
    }

    for (let i = 0; i < N; i++) {
      const p1 = nodes[i];
      const gx = Math.floor(p1[0] / cellSize);
      const gy = Math.floor(p1[1] / cellSize);

      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const k = `${gx + dx},${gy + dy}`;
          const cell = grid.get(k);
          if (!cell) continue;

          for (const j of cell) {
            if (j <= i) continue;
            // 同一チェーン内の隣接頂点は既にチェーン内隣接エッジとして接続済みなのでスキップ
            if (nodeChain[i] === nodeChain[j] && Math.abs(i - j) === 1) continue;

            const p2 = nodes[j];
            const d = calcDistKm({ lat: p1[0], lng: p1[1] }, { lat: p2[0], lng: p2[1] });
            if (d <= 0.15) {
              addJunctionEdge(i, j, d);
            }
          }
        }
      }
    }

    // 3. 連結成分 (Connected Components) 検出と端点ブリッジ (0.8km 以下)
    // データ上でわずかに途切れている路線（例: hokkaido-kaikyo 等）で安全に架橋
    const ccId = new Int32Array(N).fill(-1);
    let numCC = 0;
    for (let i = 0; i < N; i++) {
      if (ccId[i] !== -1) continue;
      const q = [i];
      ccId[i] = numCC;
      let qHead = 0;
      while (qHead < q.length) {
        const curr = q[qHead++];
        const nbrs = adj[curr];
        for (let k = 0; k < nbrs.length; k++) {
          const v = nbrs[k].to;
          if (ccId[v] === -1) {
            ccId[v] = numCC;
            q.push(v);
          }
        }
      }
      numCC++;
    }

    if (numCC > 1) {
      const endpoints = [];
      for (const range of chainRanges) {
        endpoints.push(range.startIdx);
        if (range.length > 1) {
          endpoints.push(range.startIdx + range.length - 1);
        }
      }

      // 異なる連結成分に属する端点同士の架橋 (<= 0.8km)
      for (let i = 0; i < endpoints.length; i++) {
        const u = endpoints[i];
        const p1 = nodes[u];
        for (let j = i + 1; j < endpoints.length; j++) {
          const v = endpoints[j];
          if (ccId[u] === ccId[v]) continue;
          const p2 = nodes[v];
          const d = calcDistKm({ lat: p1[0], lng: p1[1] }, { lat: p2[0], lng: p2[1] });
          if (d <= 0.8) {
            addJunctionEdge(u, v, d);
            const oldCC = ccId[v];
            const newCC = ccId[u];
            for (let k = 0; k < N; k++) {
              if (ccId[k] === oldCC) ccId[k] = newCC;
            }
          }
        }
      }

      // 端点同士で繋がらなかった残りの成分について、端点と他成分の近接頂点（<= 0.8km）を接続
      for (let i = 0; i < endpoints.length; i++) {
        const u = endpoints[i];
        const p1 = nodes[u];
        let bestV = -1;
        let bestD = 0.8;
        for (let v = 0; v < N; v++) {
          if (ccId[u] === ccId[v]) continue;
          const p2 = nodes[v];
          if (Math.abs(p1[0] - p2[0]) > 0.01 || Math.abs(p1[1] - p2[1]) > 0.01) continue;
          const d = calcDistKm({ lat: p1[0], lng: p1[1] }, { lat: p2[0], lng: p2[1] });
          if (d < bestD) {
            bestD = d;
            bestV = v;
          }
        }
        if (bestV !== -1) {
          addJunctionEdge(u, bestV, bestD);
          const oldCC = ccId[bestV];
          const newCC = ccId[u];
          for (let k = 0; k < N; k++) {
            if (ccId[k] === oldCC) ccId[k] = newCC;
          }
        }
      }
    }

    return { nodes, adj, nodeChain, chainRanges };
  }

  // 線路描画 & 並走オフセット処理 (app.js の offsetLineMeters と完全同期)
  function offsetLineMeters(points, offsetMeters) {
    if (!offsetMeters || points.length < 2) return points;
    const latLen = 111000;
    const result = [];
    const n = points.length;

    for (let i = 0; i < n; i++) {
      const lat = points[i][0];
      const lng = points[i][1];
      const lngLen = 111000 * Math.cos(lat * Math.PI / 180);

      let dx = 0, dy = 0;
      if (i > 0) {
        dx += (lng - points[i - 1][1]) * lngLen;
        dy += (lat - points[i - 1][0]) * latLen;
      }
      if (i < n - 1) {
        dx += (points[i + 1][1] - lng) * lngLen;
        dy += (points[i + 1][0] - lat) * latLen;
      }

      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;

      const newLat = lat + (ny * offsetMeters) / latLen;
      const newLng = lng + (nx * offsetMeters) / lngLen;
      result.push([newLat, newLng]);
    }
    return result;
  }

  function findLineById(lineId, lines) {
    const targetLines = lines || cachedLines || (typeof window !== 'undefined' ? window.JR_LINES : null);
    if (!targetLines) return null;
    if (Array.isArray(targetLines)) {
      return targetLines.find(l => l.id === lineId) || null;
    }
    return targetLines[lineId] || null;
  }

  function getLineTrackGraph(tracks, lineId, lines) {
    if (!tracks || !lineId) return null;
    const line = findLineById(lineId, lines);
    const offsetMeters = (line && line.trackOffset) || 0;
    const cacheKey = `${lineId}_off_${offsetMeters}`;
    if (lineTrackGraphCache.has(cacheKey)) {
      return lineTrackGraphCache.get(cacheKey);
    }
    const rawChains = tracks[lineId];
    if (!rawChains || rawChains.length === 0) {
      lineTrackGraphCache.set(cacheKey, null);
      return null;
    }
    let processedChains = rawChains;
    if (offsetMeters !== 0) {
      processedChains = rawChains.map(chain => {
        const latlngs = chain.map(pt => (pt[0] > 90 ? [pt[1], pt[0]] : pt));
        return offsetLineMeters(latlngs, offsetMeters);
      });
    }
    const graph = buildLineTrackGraph(processedChains);
    lineTrackGraphCache.set(cacheKey, graph);
    return graph;
  }

  // 優先度キュー (MinHeap: TrackMinHeap 互換エイリアス)
  const TrackMinHeap = MinHeap;

  // 点 P から線分 A-B への最近傍射影点を計算
  function projectPointToSegment(p, a, b) {
    const latLen = 111000;
    const midLat = (a[0] + b[0]) / 2;
    const lngLen = 111000 * Math.cos(midLat * Math.PI / 180);

    const abx = (b[1] - a[1]) * lngLen;
    const aby = (b[0] - a[0]) * latLen;
    const apx = (p.lng - a[1]) * lngLen;
    const apy = (p.lat - a[0]) * latLen;

    const ab2 = abx * abx + aby * aby;
    if (ab2 === 0) return { point: [a[0], a[1]], t: 0, distMeters: Math.hypot(apx, apy) };

    const t = Math.max(0, Math.min(1, (apx * abx + apy * aby) / ab2));
    const projLat = a[0] + t * (b[0] - a[0]);
    const projLng = a[1] + t * (b[1] - a[1]);

    const hx = apx - t * abx;
    const hy = apy - t * aby;
    return {
      point: [projLat, projLng],
      t: t,
      distMeters: Math.hypot(hx, hy)
    };
  }

  function findTrackShortestPath(graph, st1, st2) {
    if (!graph) return null;
    const { nodes, adj, chainRanges } = graph;
    const N = nodes.length;
    if (N === 0) return null;
    const straightDist = calcDistKm(st1, st2);

    function findCandidates(st) {
      let minD = Infinity;
      for (let i = 0; i < N; i++) {
        const d = calcDistKm(st, { lat: nodes[i][0], lng: nodes[i][1] });
        if (d < minD) minD = d;
      }
      if (minD === Infinity) return [];

      const candLimit = minD > 0.6 ? (minD + 0.3) : Math.min(0.6, Math.max(minD + 0.12, minD * 1.4));
      const cands = [];
      const ranges = chainRanges || [{ startIdx: 0, length: N }];

      for (let c = 0; c < ranges.length; c++) {
        const range = ranges[c];
        let best1 = { idx: -1, dist: Infinity };
        let best2 = { idx: -1, dist: Infinity };

        for (let i = 0; i < range.length; i++) {
          const u = range.startIdx + i;
          const d = calcDistKm(st, { lat: nodes[u][0], lng: nodes[u][1] });
          if (d < best1.dist) {
            best2 = best1;
            best1 = { idx: u, dist: d };
          } else if (d < best2.dist) {
            best2 = { idx: u, dist: d };
          }
        }

        if (best1.idx !== -1 && best1.dist <= candLimit) {
          cands.push(best1);
          if (best2.idx !== -1 && best2.dist <= candLimit && Math.abs(best2.idx - best1.idx) <= 2) {
            cands.push(best2);
          }
        }
      }

      // 万一どのチェーンも候補に入らなかった場合の安全フォールバック
      if (cands.length === 0) {
        for (let i = 0; i < N; i++) {
          const d = calcDistKm(st, { lat: nodes[i][0], lng: nodes[i][1] });
          if (d <= candLimit) {
            cands.push({ idx: i, dist: d });
          }
        }
      }
      if (cands.length === 0) {
        for (let i = 0; i < N; i++) {
          const d = calcDistKm(st, { lat: nodes[i][0], lng: nodes[i][1] });
          if (d <= minD + 0.3) {
            cands.push({ idx: i, dist: d });
          }
        }
      }

      cands.sort((a, b) => a.dist - b.dist);
      return cands.slice(0, 6);
    }

    const startCands = findCandidates(st1);
    const endCands = findCandidates(st2);

    if (startCands.length === 0 || endCands.length === 0) {
      return null;
    }

    const startIdxSet = new Set(startCands.map(sc => sc.idx));
    const isDistinctStations = (straightDist >= 0.3);
    const endSet = new Map();
    for (const ec of endCands) {
      if (isDistinctStations && startIdxSet.has(ec.idx)) {
        continue;
      }
      endSet.set(ec.idx, ec.dist);
    }
    if (endSet.size === 0) {
      // 別駅なのに同一頂点しか候補になかった場合、隣接頂点や次候補を探す
      if (isDistinctStations) {
        for (const ec of endCands) {
          const neighbors = adj[ec.idx] || [];
          for (const edge of neighbors) {
            if (!startIdxSet.has(edge.to)) {
              const d = calcDistKm(st2, { lat: nodes[edge.to][0], lng: nodes[edge.to][1] });
              endSet.set(edge.to, d);
            }
          }
        }
      }
      if (endSet.size === 0) {
        for (const ec of endCands) {
          endSet.set(ec.idx, ec.dist);
        }
      }
    }

    const SNAP_PENALTY = 15.0;
    const dist = new Float64Array(N).fill(Infinity);
    const prev = new Int32Array(N).fill(-1);

    const pq = new TrackMinHeap();
    for (const sc of startCands) {
      const snapCost = sc.dist * SNAP_PENALTY;
      dist[sc.idx] = snapCost;
      pq.push({ idx: sc.idx, d: snapCost });
    }

    let bestEndIdx = -1;
    let bestTotalDist = Infinity;

    while (pq.size() > 0) {
      const curr = pq.pop();
      const u = curr.idx;
      if (curr.d > dist[u]) continue;

      if (endSet.has(u)) {
        const total = curr.d + endSet.get(u) * SNAP_PENALTY;
        if (total < bestTotalDist) {
          bestTotalDist = total;
          bestEndIdx = u;
        }
      }
      if (curr.d >= bestTotalDist) {
        break;
      }

      const neighbors = adj[u];
      for (let i = 0; i < neighbors.length; i++) {
        const edge = neighbors[i];
        const v = edge.to;
        const nd = curr.d + edge.dist;
        if (nd < dist[v]) {
          dist[v] = nd;
          prev[v] = u;
          pq.push({ idx: v, d: nd });
        }
      }
    }

    if (bestEndIdx === -1) return null;

    const path = [];
    let curr = bestEndIdx;
    while (curr !== -1) {
      path.push(curr);
      curr = prev[curr];
    }
    path.reverse();

    // 同一頂点0歩終了の防止: 駅間直線距離が 0.3km 以上あるのに path.length <= 1 の場合
    if (isDistinctStations && path.length <= 1) {
      const u0 = path[0];
      const neighbors = adj[u0] || [];
      let bestV = -1;
      let minComboDist = Infinity;
      for (const edge of neighbors) {
        const v = edge.to;
        const dSt2 = calcDistKm(st2, { lat: nodes[v][0], lng: nodes[v][1] });
        if (dSt2 < minComboDist) {
          minComboDist = dSt2;
          bestV = v;
        }
      }
      if (bestV !== -1) {
        path.push(bestV);
      }
    }

    return path.map(i => nodes[i]);
  }

  // 座標列の微小重複および鋭角折り返しトゲ (V字トゲ・スパイク) を除去
  function cleanPolylineSpikes(pts) {
    if (!pts || pts.length < 3) return pts ? pts.slice() : [];
    let result = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      const p = pts[i];
      const prev = result[result.length - 1];
      if (Math.hypot(p[0] - prev[0], p[1] - prev[1]) > 0.00003) {
        result.push(p);
      }
    }

    let changed = true;
    let passes = 0;
    while (changed && passes < 3 && result.length >= 3) {
      changed = false;
      passes++;
      const filtered = [result[0]];
      for (let i = 1; i < result.length - 1; i++) {
        const p0 = filtered[filtered.length - 1];
        const p1 = result[i];
        const p2 = result[i + 1];

        const latLen = 111000;
        const midLat = p1[0];
        const lngLen = 111000 * Math.cos(midLat * Math.PI / 180);

        const v1x = (p1[1] - p0[1]) * lngLen;
        const v1y = (p1[0] - p0[0]) * latLen;
        const v2x = (p2[1] - p1[1]) * lngLen;
        const v2y = (p2[0] - p1[0]) * latLen;

        const l1 = Math.hypot(v1x, v1y);
        const l2 = Math.hypot(v2x, v2y);

        if (l1 > 0 && l2 > 0) {
          const cosAngle = (v1x * v2x + v1y * v2y) / (l1 * l2);
          // 内積 < -0.3 (約107度以上の鋭角Uターン折り返し) で、かつ局所的なトゲ (片側300m以内) を除去
          if (cosAngle < -0.3 && (l1 < 300 || l2 < 300)) {
            changed = true;
            continue;
          }
        }
        filtered.push(p1);
      }
      filtered.push(result[result.length - 1]);
      result = filtered;
    }
    return result;
  }

  // 線路頂点と駅座標の端点接続において、進行方向と逆向きに一旦進む鋭角スパイク（折り返しヒゲ）を除去
  function smoothPathEndpoints(rawPath, st1, st2) {
    if (!rawPath || rawPath.length <= 2) return rawPath;

    let pts = rawPath.slice();

    // 始点側のスパイク（折り返しヒゲ）除去:
    // 駅 st1 -> pts[0] のベクトルと pts[0] -> pts[1] のベクトルの方向を調べ、
    // 逆向き鋭角（cosAngle < -0.2）かつ pts[1] の方が st1 に近い場合のみ pts[0] を除去
    if (pts.length > 2) {
      const latLen = 111000;
      const midLat = pts[0][0];
      const lngLen = 111000 * Math.cos(midLat * Math.PI / 180);

      const vsx = (pts[0][1] - st1.lng) * lngLen;
      const vsy = (pts[0][0] - st1.lat) * latLen;
      const lenVs = Math.hypot(vsx, vsy) || 1;

      const vtx = (pts[1][1] - pts[0][1]) * lngLen;
      const vty = (pts[1][0] - pts[0][0]) * latLen;
      const lenVt = Math.hypot(vtx, vty) || 1;

      const cosAngle = (vsx * vtx + vsy * vty) / (lenVs * lenVt);
      const d0 = calcDistKm(st1, { lat: pts[0][0], lng: pts[0][1] });
      const d1 = calcDistKm(st1, { lat: pts[1][0], lng: pts[1][1] });

      if (cosAngle < -0.2 && d1 < d0) {
        pts.shift();
      }
    }

    // 終点側のスパイク（折り返しヒゲ）除去:
    // pts[last-1] -> pts[last] のベクトルと pts[last] -> st2 のベクトルの方向を調べ、
    // 逆向き鋭角（cosAngle < -0.2）かつ pts[last-1] の方が st2 に近い場合のみ pts[last] を除去
    if (pts.length > 2) {
      const last = pts.length - 1;
      const latLen = 111000;
      const midLat = pts[last][0];
      const lngLen = 111000 * Math.cos(midLat * Math.PI / 180);

      const vtx = (pts[last][1] - pts[last - 1][1]) * lngLen;
      const vty = (pts[last][0] - pts[last - 1][0]) * latLen;
      const lenVt = Math.hypot(vtx, vty) || 1;

      const vsx = (st2.lng - pts[last][1]) * lngLen;
      const vsy = (st2.lat - pts[last][0]) * latLen;
      const lenVs = Math.hypot(vsx, vsy) || 1;

      const cosAngle = (vtx * vsx + vty * vsy) / (lenVt * lenVs);
      const dLast = calcDistKm(st2, { lat: pts[last][0], lng: pts[last][1] });
      const dPrev = calcDistKm(st2, { lat: pts[last - 1][0], lng: pts[last - 1][1] });

      if (cosAngle < -0.2 && dPrev < dLast) {
        pts.pop();
      }
    }

    return pts;
  }

  // セグメント線路座標の抽出 (トポロジーグラフ最短経路探索 + 幾何サニティチェック + 確実な端点スナップ)
  function getSegmentCoords(tracks, stations, lineId, fromStId, toStId, lines) {
    const st1 = stations[fromStId];
    const st2 = stations[toStId];
    if (!st1 || !st2 || !tracks) return [];

    const straightKm = calcDistKm(st1, st2);

    function tryLineCoords(lid) {
      const graph = getLineTrackGraph(tracks, lid, lines);
      if (!graph) return null;
      const rawPath = findTrackShortestPath(graph, st1, st2);
      if (!rawPath || rawPath.length === 0) return null;

      // 端点スナップを含めた累積実距離の計算
      const startSnapDist = calcDistKm(st1, { lat: rawPath[0][0], lng: rawPath[0][1] });
      const endSnapDist = calcDistKm(st2, { lat: rawPath[rawPath.length - 1][0], lng: rawPath[rawPath.length - 1][1] });

      // 端点スナップ距離の閾値 (新幹線は長大駅間・間引きのため6.0km、在来線は3.5km)
      const maxSnap = lid.startsWith('shinkansen-') ? 6.0 : 3.5;
      if (startSnapDist > maxSnap || endSnapDist > maxSnap) {
        return null;
      }

      let polyKm = startSnapDist + endSnapDist;
      for (let k = 0; k < rawPath.length - 1; k++) {
        polyKm += calcDistKm({ lat: rawPath[k][0], lng: rawPath[k][1] }, { lat: rawPath[k + 1][0], lng: rawPath[k + 1][1] });
      }

      // 幾何サニティチェック (異常な大回り・他方面への寄り道を検知)
      const maxAllowed = Math.max(straightKm * 2.5 + 3.0, 5.0);
      if (polyKm > maxAllowed) {
        return null;
      }

      return rawPath;
    }

    // 1. 指定路線 (lineId) の線路トポロジーグラフから最優先で探索 (新幹線指定時は新幹線軌道を確実に採用)
    let path = null;
    if (lineId) {
      path = tryLineCoords(lineId);
    }

    // 2. 指定路線で線路が見つからない場合のみ、駅共通の他路線をフォールバック探索
    // (新幹線なら新幹線のみ、在来線なら在来線のみを候補とし、軌道の混入を防止)
    if (!path && st1.lines && st2.lines) {
      const isShinkansen = !!(lineId && lineId.startsWith('shinkansen-'));
      const otherLines = st1.lines.filter(lid => {
        if (lid === lineId || !st2.lines.includes(lid)) return false;
        const otherIsShinkansen = lid.startsWith('shinkansen-');
        return isShinkansen ? otherIsShinkansen : !otherIsShinkansen;
      });
      for (const lid of otherLines) {
        path = tryLineCoords(lid);
        if (path) break;
      }
    }

    // 3. 共用・並行区間フォールバック
    // 新幹線セグメントの場合: 東北新幹線など共用親路線をフォールバック
    if (!path && lineId && lineId.startsWith('shinkansen-')) {
      const shinkansenCandidates = [
        'shinkansen-tohoku', 'shinkansen-tokaido', 'shinkansen-sanyo',
        'shinkansen-joetsu', 'shinkansen-hokuriku', 'shinkansen-kyushu'
      ];
      for (const lid of shinkansenCandidates) {
        if (lid === lineId) continue;
        path = tryLineCoords(lid);
        if (path) break;
      }
    } else if (!path && lineId && !lineId.startsWith('shinkansen-')) {
      // 在来線セグメントの場合: 駅の有する他在来線をフォールバック
      const candLines = Array.from(new Set([...(st1.lines || []), ...(st2.lines || [])]))
        .filter(lid => lid !== lineId && !lid.startsWith('shinkansen-'));
      for (const lid of candLines) {
        path = tryLineCoords(lid);
        if (path) break;
      }
    }

    // 4. 線路が見つからなかった、または異常判定された場合は両駅間の直線フォールバック
    if (!path || path.length === 0) {
      return [[st1.lat, st1.lng], [st2.lat, st2.lng]];
    }

    // ヒゲ除去
    let trimmedPath = smoothPathEndpoints(path, st1, st2);

    // 線分射影による「背景線路へのピタッと吸着」端点補正
    if (trimmedPath.length >= 2) {
      // 始点側: st1 から線分 trimmedPath[0]-trimmedPath[1] への射影
      const proj1 = projectPointToSegment(st1, trimmedPath[0], trimmedPath[1]);
      if (proj1.t >= 0 && proj1.t <= 1) {
        trimmedPath[0] = proj1.point;
      }
      // 終点側: st2 から線分 trimmedPath[last-1]-trimmedPath[last] への射影
      const last = trimmedPath.length - 1;
      const proj2 = projectPointToSegment(st2, trimmedPath[last - 1], trimmedPath[last]);
      if (proj2.t >= 0 && proj2.t <= 1) {
        trimmedPath[last] = proj2.point;
      }
    }

    // 生駅座標の強制 push/unshift を廃止し、オフセット実線路上の射影点列をそのまま返す
    // （微小重複頂点および鋭角折り返しトゲをクリーンアップ）
    const resultCoords = [];
    for (let k = 0; k < trimmedPath.length; k++) {
      const p = trimmedPath[k];
      if (resultCoords.length === 0) {
        resultCoords.push(p);
      } else {
        const prev = resultCoords[resultCoords.length - 1];
        if (Math.hypot(p[0] - prev[0], p[1] - prev[1]) > 0.00003) {
          resultCoords.push(p);
        }
      }
    }

    return cleanPolylineSpikes(resultCoords);
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
    if (stId && !stations[stId]) {
      const byName = Object.values(stations).find(s => s.name === stId);
      if (byName) return byName;
    }
    if (!stName) return null;
    if (stations[stName]) return stations[stName];
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
      const chains = [l.stations, ...(l.branches || [])];
      for (const chain of chains) {
        const names = chain.map(id => targetStations[id]?.name).filter(Boolean);
        const i1 = names.indexOf(fromName);
        const i2 = names.indexOf(toName);
        if (i1 !== -1 && i2 !== -1) {
          const s = Math.min(i1, i2);
          const e = Math.max(i1, i2);
          return names.slice(s, e + 1);
        }
      }
      return [];
    }

    const corridorDefs = [
      // 1. 東海道新幹線 (熱海〜新大阪: 旅規第16条の2 / ※東京〜熱海は2026年3月改定により完全別線のため含めない)
      { id: 'same-line::tokaido::atami-mishima', endpoints: ['熱海', '三島'], isParagraph2: false, sLine: 'shinkansen-tokaido', sSts: ['熱海', '三島'], cLines: ['tokaido', 'tokai-tokaido'], cSts: getStationNames('tokai-tokaido', '熱海', '三島') },
      { id: 'same-line::tokaido::mishima-shizuoka', endpoints: ['三島', '静岡'], isParagraph2: true, sLine: 'shinkansen-tokaido', sSts: ['三島', '新富士', '静岡'], cLines: ['tokai-tokaido'], cSts: getStationNames('tokai-tokaido', '三島', '静岡') },
      { id: 'same-line::tokaido::shizuoka-kakegawa', endpoints: ['静岡', '掛川'], isParagraph2: false, sLine: 'shinkansen-tokaido', sSts: ['静岡', '掛川'], cLines: ['tokai-tokaido'], cSts: getStationNames('tokai-tokaido', '静岡', '掛川') },
      { id: 'same-line::tokaido::kakegawa-hamamatsu', endpoints: ['掛川', '浜松'], isParagraph2: false, sLine: 'shinkansen-tokaido', sSts: ['掛川', '浜松'], cLines: ['tokai-tokaido'], cSts: getStationNames('tokai-tokaido', '掛川', '浜松') },
      { id: 'same-line::tokaido::hamamatsu-toyohashi', endpoints: ['浜松', '豊橋'], isParagraph2: false, sLine: 'shinkansen-tokaido', sSts: ['浜松', '豊橋'], cLines: ['tokai-tokaido'], cSts: getStationNames('tokai-tokaido', '浜松', '豊橋') },
      { id: 'same-line::tokaido::toyohashi-mikawaanjo', endpoints: ['豊橋', '三河安城'], isParagraph2: false, sLine: 'shinkansen-tokaido', sSts: ['豊橋', '三河安城'], cLines: ['tokai-tokaido'], cSts: getStationNames('tokai-tokaido', '豊橋', '三河安城') },
      { id: 'same-line::tokaido::mikawaanjo-nagoya', endpoints: ['三河安城', '名古屋'], isParagraph2: false, sLine: 'shinkansen-tokaido', sSts: ['三河安城', '名古屋'], cLines: ['tokai-tokaido'], cSts: getStationNames('tokai-tokaido', '三河安城', '名古屋') },
      { id: 'same-line::tokaido::nagoya-maibara', endpoints: ['名古屋', '米原'], isParagraph2: true, sLine: 'shinkansen-tokaido', sSts: ['名古屋', '岐阜羽島', '米原'], cLines: ['tokai-tokaido', 'tokaido-west', 'tokai-minoakasaka'], cSts: getStationNames('tokai-tokaido', '名古屋', '米原') },
      { id: 'same-line::tokaido::maibara-kyoto', endpoints: ['米原', '京都'], isParagraph2: false, sLine: 'shinkansen-tokaido', sSts: ['米原', '京都'], cLines: ['tokaido-west'], cSts: getStationNames('tokaido-west', '米原', '京都') },
      { id: 'same-line::tokaido::kyoto-shinosaka', endpoints: ['京都', '新大阪'], isParagraph2: false, sLine: 'shinkansen-tokaido', sSts: ['京都', '新大阪'], cLines: ['tokaido-west'], cSts: getStationNames('tokaido-west', '京都', '新大阪') },

      // 2. 山陽新幹線 (新大阪〜新下関: 旅規第16条の2 第1項・第2項 / ※新下関〜博多は完全別線のため含めない)
      { id: 'same-line::sanyo::shinosaka-nishiakashi', endpoints: ['新大阪', '西明石'], isParagraph2: true, sLine: 'shinkansen-sanyo', sSts: ['新大阪', '新神戸', '西明石'], cLines: ['tokaido-west', 'sanyo-main'], cSts: [...getStationNames('tokaido-west', '新大阪', '神戸'), ...getStationNames('sanyo-main', '神戸', '西明石')] },
      { id: 'same-line::sanyo::nishiakashi-himeji', endpoints: ['西明石', '姫路'], isParagraph2: false, sLine: 'shinkansen-sanyo', sSts: ['西明石', '姫路'], cLines: ['sanyo-main'], cSts: getStationNames('sanyo-main', '西明石', '姫路') },
      { id: 'same-line::sanyo::himeji-aioi', endpoints: ['姫路', '相生'], isParagraph2: false, sLine: 'shinkansen-sanyo', sSts: ['姫路', '相生'], cLines: ['sanyo-main'], cSts: getStationNames('sanyo-main', '姫路', '相生') },
      { id: 'same-line::sanyo::aioi-okayama', endpoints: ['相生', '岡山'], isParagraph2: false, sLine: 'shinkansen-sanyo', sSts: ['相生', '岡山'], cLines: ['sanyo-main'], cSts: getStationNames('sanyo-main', '相生', '岡山') },
      { id: 'same-line::sanyo::okayama-shinkurashiki', endpoints: ['岡山', '新倉敷'], isParagraph2: false, sLine: 'shinkansen-sanyo', sSts: ['岡山', '新倉敷'], cLines: ['sanyo-main'], cSts: getStationNames('sanyo-main', '岡山', '新倉敷') },
      { id: 'same-line::sanyo::shinkurashiki-fukuyama', endpoints: ['新倉敷', '福山'], isParagraph2: false, sLine: 'shinkansen-sanyo', sSts: ['新倉敷', '福山'], cLines: ['sanyo-main'], cSts: getStationNames('sanyo-main', '新倉敷', '福山') },
      { id: 'same-line::sanyo::fukuyama-mihara', endpoints: ['福山', '三原'], isParagraph2: true, sLine: 'shinkansen-sanyo', sSts: ['福山', '新尾道', '三原'], cLines: ['sanyo-main'], cSts: getStationNames('sanyo-main', '福山', '三原') },
      { id: 'same-line::sanyo::mihara-hiroshima', endpoints: ['三原', '広島'], isParagraph2: true, sLine: 'shinkansen-sanyo', sSts: ['三原', '東広島', '広島'], cLines: ['sanyo-main'], cSts: getStationNames('sanyo-main', '三原', '広島') },
      { id: 'same-line::sanyo::hiroshima-tokuyama', endpoints: ['広島', '徳山'], isParagraph2: true, sLine: 'shinkansen-sanyo', sSts: ['広島', '新岩国', '徳山'], cLines: ['sanyo-main'], cSts: getStationNames('sanyo-main', '広島', '徳山') },
      { id: 'same-line::sanyo::tokuyama-shinyamaguchi', endpoints: ['徳山', '新山口'], isParagraph2: false, sLine: 'shinkansen-sanyo', sSts: ['徳山', '新山口'], cLines: ['sanyo-main'], cSts: getStationNames('sanyo-main', '徳山', '新山口') },
      { id: 'same-line::sanyo::shinyamaguchi-asa', endpoints: ['新山口', '厚狭'], isParagraph2: false, sLine: 'shinkansen-sanyo', sSts: ['新山口', '厚狭'], cLines: ['sanyo-main'], cSts: getStationNames('sanyo-main', '新山口', '厚狭') },
      { id: 'same-line::sanyo::asa-shinshimonoseki', endpoints: ['厚狭', '新下関'], isParagraph2: false, sLine: 'shinkansen-sanyo', sSts: ['厚狭', '新下関'], cLines: ['sanyo-main'], cSts: getStationNames('sanyo-main', '厚狭', '新下関') },

      // 3. 東北新幹線 (東京〜盛岡)
      {
        id: 'same-line::tohoku::tokyo-ueno',
        endpoints: ['東京', '上野'],
        isParagraph2: false,
        sLine: 'shinkansen-tohoku',
        sLines: ['shinkansen-tohoku', 'shinkansen-joetsu', 'shinkansen-hokuriku', 'shinkansen-yamagata', 'shinkansen-akita'],
        sSts: ['東京', '上野'],
        cLines: ['tohoku-main'],
        cSts: getStationNames('tohoku-main', '東京', '上野')
      },
      {
        id: 'same-line::tohoku::ueno-omiya',
        endpoints: ['上野', '大宮'],
        isParagraph2: false,
        sLine: 'shinkansen-tohoku',
        sLines: ['shinkansen-tohoku', 'shinkansen-joetsu', 'shinkansen-hokuriku', 'shinkansen-yamagata', 'shinkansen-akita'],
        sSts: ['上野', '大宮'],
        cLines: ['tohoku-main', 'akabane-line'],
        cSts: [
          '上野', '日暮里', '西日暮里', '田端', '尾久', '赤羽', '川口', '西川口', '蕨',
          '南浦和', '浦和', '北浦和', '与野', 'さいたま新都心', '大宮',
          '北赤羽', '浮間舟渡', '戸田公園', '戸田', '北戸田', '武蔵浦和', '中浦和', '南与野', '与野本町', '北与野'
        ]
      },
      { id: 'same-line::tohoku::omiya-oyama', endpoints: ['大宮', '小山'], isParagraph2: false, sLine: 'shinkansen-tohoku', sSts: ['大宮', '小山'], cLines: ['tohoku-main'], cSts: getStationNames('tohoku-main', '大宮', '小山') },
      { id: 'same-line::tohoku::oyama-utsunomiya', endpoints: ['小山', '宇都宮'], isParagraph2: false, sLine: 'shinkansen-tohoku', sSts: ['小山', '宇都宮'], cLines: ['tohoku-main'], cSts: getStationNames('tohoku-main', '小山', '宇都宮') },
      { id: 'same-line::tohoku::utsunomiya-nasushiobara', endpoints: ['宇都宮', '那須塩原'], isParagraph2: false, sLine: 'shinkansen-tohoku', sSts: ['宇都宮', '那須塩原'], cLines: ['tohoku-main'], cSts: getStationNames('tohoku-main', '宇都宮', '那須塩原') },
      { id: 'same-line::tohoku::nasushiobara-shinshirakawa', endpoints: ['那須塩原', '新白河'], isParagraph2: false, sLine: 'shinkansen-tohoku', sSts: ['那須塩原', '新白河'], cLines: ['tohoku-main'], cSts: getStationNames('tohoku-main', '那須塩原', '新白河') },
      { id: 'same-line::tohoku::shinshirakawa-koriyama', endpoints: ['新白河', '郡山'], isParagraph2: false, sLine: 'shinkansen-tohoku', sSts: ['新白河', '郡山'], cLines: ['tohoku-main'], cSts: getStationNames('tohoku-main', '新白河', '郡山') },
      { id: 'same-line::tohoku::koriyama-fukushima', endpoints: ['郡山', '福島'], isParagraph2: false, sLine: 'shinkansen-tohoku', sSts: ['郡山', '福島'], cLines: ['tohoku-main'], cSts: getStationNames('tohoku-main', '郡山', '福島') },
      { id: 'same-line::tohoku::fukushima-sendai', endpoints: ['福島', '仙台'], isParagraph2: true, sLine: 'shinkansen-tohoku', sSts: ['福島', '白石蔵王', '仙台'], cLines: ['tohoku-main'], cSts: getStationNames('tohoku-main', '福島', '仙台') },
      { id: 'same-line::tohoku::sendai-ichinoseki', endpoints: ['仙台', '一ノ関'], isParagraph2: true, sLine: 'shinkansen-tohoku', sSts: ['仙台', '古川', 'くりこま高原', '一ノ関'], cLines: ['tohoku-main'], cSts: getStationNames('tohoku-main', '仙台', '一ノ関') },
      { id: 'same-line::tohoku::ichinoseki-kitakami', endpoints: ['一ノ関', '北上'], isParagraph2: true, sLine: 'shinkansen-tohoku', sSts: ['一ノ関', '水沢江刺', '北上'], cLines: ['tohoku-main'], cSts: getStationNames('tohoku-main', '一ノ関', '北上') },
      { id: 'same-line::tohoku::kitakami-morioka', endpoints: ['北上', '盛岡'], isParagraph2: true, sLine: 'shinkansen-tohoku', sSts: ['北上', '新花巻', '盛岡'], cLines: ['tohoku-main'], cSts: getStationNames('tohoku-main', '北上', '盛岡') },

      // 4. 上越新幹線 (大宮〜新潟)
      { id: 'same-line::joetsu::omiya-kumagaya', endpoints: ['大宮', '熊谷'], isParagraph2: false, sLine: 'shinkansen-joetsu', sSts: ['大宮', '熊谷'], cLines: ['takasaki-line'], cSts: getStationNames('takasaki-line', '大宮', '熊谷') },
      { id: 'same-line::joetsu::kumagaya-takasaki', endpoints: ['熊谷', '高崎'], isParagraph2: true, sLine: 'shinkansen-joetsu', sSts: ['熊谷', '本庄早稲田', '高崎'], cLines: ['takasaki-line'], cSts: getStationNames('takasaki-line', '熊谷', '高崎') },
      { id: 'same-line::joetsu::takasaki-echigoyuzawa', endpoints: ['高崎', '越後湯沢'], isParagraph2: true, sLine: 'shinkansen-joetsu', sSts: ['高崎', '上毛高原', '越後湯沢'], cLines: ['joetsu-line'], cSts: getStationNames('joetsu-line', '高崎', '越後湯沢') },
      { id: 'same-line::joetsu::echigoyuzawa-urasa', endpoints: ['越後湯沢', '浦佐'], isParagraph2: false, sLine: 'shinkansen-joetsu', sSts: ['越後湯沢', '浦佐'], cLines: ['joetsu-line'], cSts: getStationNames('joetsu-line', '越後湯沢', '浦佐') },
      { id: 'same-line::joetsu::urasa-nagaoka', endpoints: ['浦佐', '長岡'], isParagraph2: false, sLine: 'shinkansen-joetsu', sSts: ['浦佐', '長岡'], cLines: ['joetsu-line', 'shinetsu-line'], cSts: [...getStationNames('joetsu-line', '浦佐', '宮内'), ...getStationNames('shinetsu-line', '宮内', '長岡')] },
      { id: 'same-line::joetsu::nagaoka-niigata', endpoints: ['長岡', '新潟'], isParagraph2: true, sLine: 'shinkansen-joetsu', sSts: ['長岡', '燕三条', '新潟'], cLines: ['shinetsu-line'], cSts: getStationNames('shinetsu-line', '長岡', '新潟') },

      // 5. 九州新幹線 (博多〜新八代、川内〜鹿児島中央)
      { id: 'same-line::kyushu::hakata-kurume', endpoints: ['博多', '久留米'], isParagraph2: true, sLine: 'shinkansen-kyushu', sSts: ['博多', '新鳥栖', '久留米'], cLines: ['kyushu-kagoshima'], cSts: getStationNames('kyushu-kagoshima', '博多', '久留米') },
      { id: 'same-line::kyushu::kurume-chikugofunagoya', endpoints: ['久留米', '筑後船小屋'], isParagraph2: false, sLine: 'shinkansen-kyushu', sSts: ['久留米', '筑後船小屋'], cLines: ['kyushu-kagoshima'], cSts: getStationNames('kyushu-kagoshima', '久留米', '筑後船小屋') },
      { id: 'same-line::kyushu::chikugofunagoya-kumamoto', endpoints: ['筑後船小屋', '熊本'], isParagraph2: true, sLine: 'shinkansen-kyushu', sSts: ['筑後船小屋', '新大牟田', '新玉名', '熊本'], cLines: ['kyushu-kagoshima'], cSts: getStationNames('kyushu-kagoshima', '筑後船小屋', '熊本') },
      { id: 'same-line::kyushu::kumamoto-shinyatsushiro', endpoints: ['熊本', '新八代'], isParagraph2: false, sLine: 'shinkansen-kyushu', sSts: ['熊本', '新八代'], cLines: ['kyushu-kagoshima'], cSts: getStationNames('kyushu-kagoshima', '熊本', '新八代') },
      { id: 'same-line::kyushu::sendai-kagoshimachuo', endpoints: ['川内', '鹿児島中央'], isParagraph2: false, sLine: 'shinkansen-kyushu', sSts: ['川内', '鹿児島中央'], cLines: ['kyushu-kagoshima'], cSts: getStationNames('kyushu-kagoshima', '川内', '鹿児島中央') },

      // 6. 西九州新幹線 (諫早〜長崎)
      { id: 'same-line::nishi-kyushu::isahaya-nagasaki', endpoints: ['諫早', '長崎'], isParagraph2: false, sLine: 'shinkansen-nishi-kyushu', sSts: ['諫早', '長崎'], cLines: ['kyushu-nagasaki'], cSts: getStationNames('kyushu-nagasaki', '諫早', '長崎') }
    ];

    CACHED_PARALLEL_CORRIDORS = corridorDefs.map(def => {
      const endpoints = def.endpoints || [def.sSts[0], def.sSts[def.sSts.length - 1]];
      const intermediateNames = new Set(def.cSts.filter(n => !endpoints.includes(n)));
      const intermediateIds = new Set();
      (def.cLines || []).forEach(lid => {
        const l = lineMap[lid];
        if (!l) return;
        [l.stations, ...(l.branches || [])].flat().forEach(stId => {
          if (intermediateNames.has(targetStations[stId]?.name)) {
            intermediateIds.add(stId);
          }
        });
      });

      const sIntermediateNames = new Set(def.sSts.filter(n => !endpoints.includes(n)));
      const sIntermediateIds = new Set();
      (def.sLines || [def.sLine]).forEach(lid => {
        const l = lineMap[lid];
        if (!l) return;
        [l.stations, ...(l.branches || [])].flat().forEach(stId => {
          if (sIntermediateNames.has(targetStations[stId]?.name)) {
            sIntermediateIds.add(stId);
          }
        });
      });

      return {
        id: def.id,
        endpoints: endpoints,
        isParagraph2: !!def.isParagraph2,
        shinkansenLine: def.sLine || (def.sLines && def.sLines[0]),
        shinkansenLines: new Set(def.sLines || [def.sLine]),
        shinkansenStations: new Set(def.sSts),
        conventionalLines: new Set(def.cLines),
        conventionalStations: new Set(def.cSts),
        conventionalIntermediateStationIds: intermediateIds,
        shinkansenIntermediateStationIds: sIntermediateIds
      };
    });

    return CACHED_PARALLEL_CORRIDORS;
  }

  // コリドー内の新幹線・並行在来線エッジキーの取得キャッシュ
  function getCorridorEdges(graph, stations, corridor) {
    if (corridor._cachedEdges) return corridor._cachedEdges;
    const sEdges = new Set();
    const cEdges = new Set();
    graph.forEach((edges, u) => {
      const stU = stations[u];
      const nU = stU ? stU.name : u;
      edges.forEach(e => {
        const v = e.to;
        const stV = stations[v];
        const nV = stV ? stV.name : v;
        const isMatchS = corridor.shinkansenLines ? corridor.shinkansenLines.has(e.lineId) : (e.lineId === corridor.shinkansenLine);
        if (isMatchS && corridor.shinkansenStations.has(nU) && corridor.shinkansenStations.has(nV)) {
          sEdges.add(u + '::' + v);
          sEdges.add(v + '::' + u);
        }
        if (corridor.conventionalLines.has(e.lineId) && corridor.conventionalStations.has(nU) && corridor.conventionalStations.has(nV)) {
          cEdges.add(u + '::' + v);
          cEdges.add(v + '::' + u);
        }
      });
    });
    corridor._cachedEdges = { sEdges, cEdges };
    return corridor._cachedEdges;
  }

  // 原則同一線コリドー (isParagraph2 === false) のエッジマップキャッシュ
  let CACHED_PARALLEL_EDGE_MAP = null;

  function getSameLineParallelEdgeMap(stations, lines) {
    if (CACHED_PARALLEL_EDGE_MAP) return CACHED_PARALLEL_EDGE_MAP;
    const targetStations = stations || cachedStations;
    const targetLines = lines || cachedLines;
    if (!targetStations || !targetLines) return new Map();

    const corridors = getSameLineParallelCorridors(targetStations, targetLines);
    const lineMap = {};
    (Array.isArray(targetLines) ? targetLines : Object.values(targetLines)).forEach(l => {
      if (l && l.id) lineMap[l.id] = l;
    });

    const map = new Map();

    corridors.forEach(c => {
      if (c.isParagraph2) return; // 原則同一線区間 (isParagraph2 === false) のみ対象

      // 1. 新幹線側エッジ
      c.shinkansenLines.forEach(lineId => {
        const l = lineMap[lineId];
        if (!l) return;
        const chains = [l.stations, ...(l.branches || [])];
        chains.forEach(chain => {
          for (let i = 0; i < chain.length - 1; i++) {
            const u = chain[i];
            const v = chain[i + 1];
            const nu = targetStations[u]?.name || u;
            const nv = targetStations[v]?.name || v;
            if (c.shinkansenStations.has(nu) && c.shinkansenStations.has(nv)) {
              const val = { corridorId: c.id, isParagraph2: false, side: 'shinkansen' };
              map.set(lineId + '::' + nu + '::' + nv, val);
              map.set(lineId + '::' + nv + '::' + nu, val);
              map.set(lineId + '::' + u + '::' + v, val);
              map.set(lineId + '::' + v + '::' + u, val);
            }
          }
        });
      });

      // 2. 在来線側エッジ
      c.conventionalLines.forEach(lineId => {
        const l = lineMap[lineId];
        if (!l) return;
        const chains = [l.stations, ...(l.branches || [])];
        chains.forEach(chain => {
          for (let i = 0; i < chain.length - 1; i++) {
            const u = chain[i];
            const v = chain[i + 1];
            const nu = targetStations[u]?.name || u;
            const nv = targetStations[v]?.name || v;
            if (c.conventionalStations.has(nu) && c.conventionalStations.has(nv)) {
              const val = { corridorId: c.id, isParagraph2: false, side: 'conventional' };
              map.set(lineId + '::' + nu + '::' + nv, val);
              map.set(lineId + '::' + nv + '::' + nu, val);
              map.set(lineId + '::' + u + '::' + v, val);
              map.set(lineId + '::' + v + '::' + u, val);
            }
          }
        });
      });
    });

    CACHED_PARALLEL_EDGE_MAP = map;
    return CACHED_PARALLEL_EDGE_MAP;
  }

  /**
   * 実物マルス経由印字フォーマッタ (JRマルス券面印字仕様完全準拠)
   * fareRules (特定都区市内・山手線内・第70条適用結果) 確定後に呼び出される
   */
  function buildMarsTicketViaString(lineRuns, fareRules, deptName, destName, stations, fullSegments, options = {}) {
    if (!lineRuns || lineRuns.length === 0) {
      return { marsFormatString: '(直通)', marsNamesList: ['(直通)'] };
    }

    let FareRulesDataLocal = null;
    if (typeof window !== 'undefined' && window.JR_FARE_RULES_DATA) {
      FareRulesDataLocal = window.JR_FARE_RULES_DATA;
    } else if (typeof require !== 'undefined') {
      try {
        FareRulesDataLocal = require('./data/fare-rules-data.js');
      } catch (e) {}
    }

    let FareEngineLocal = null;
    if (typeof window !== 'undefined' && window.JR_FARE_ENGINE) {
      FareEngineLocal = window.JR_FARE_ENGINE;
    } else if (typeof require !== 'undefined') {
      try {
        FareEngineLocal = require('./fare-engine.js');
      } catch (e) {}
    }

    const SPECIFIC_CITY_ZONES = (FareRulesDataLocal && FareRulesDataLocal.SPECIFIC_CITY_ZONES) || {};
    const isStationInZone = (FareEngineLocal && FareEngineLocal.isStationInZone) || ((stId, stName, zone, stMap) => {
      if (!zone || !zone.stationNames || !zone.stationNames.has(stName)) return false;
      return true;
    });

    // 1. 中央東線（チユト：東京〜塩尻）の統合ルール
    const runs = lineRuns.map(r => ({
      ...r,
      stationIds: [...(r.stationIds || [])],
      segments: [...(r.segments || [])]
    }));

    for (let i = 0; i < runs.length; i++) {
      const r = runs[i];
      const fSt = stations[r.from];
      const tSt = stations[r.to];
      const fName = fSt ? fSt.name : r.from;
      const tName = tSt ? tSt.name : r.to;

      if (r.lineId === 'tohoku-main') {
        const isTokyoKanda = (fName === '東京' && tName === '神田') || (fName === '神田' && tName === '東京');
        if (isTokyoKanda) {
          const prev = runs[i - 1];
          const next = runs[i + 1];
          const prevIsChuo = prev && prev.lineId === 'chuo-main';
          const nextIsChuo = next && next.lineId === 'chuo-main';
          if (prevIsChuo || nextIsChuo) {
            r.marsName = '中央東';
          }
        }
      } else if (r.lineId === 'yamanote') {
        const isYoyogiShinjuku = (fName === '代々木' && tName === '新宿') || (fName === '新宿' && tName === '代々木');
        if (isYoyogiShinjuku) {
          const prev = runs[i - 1];
          const next = runs[i + 1];
          const prevIsChuo = prev && prev.lineId === 'chuo-main';
          const nextIsChuo = next && next.lineId === 'chuo-main';
          if (prevIsChuo || nextIsChuo) {
            r.marsName = '中央東';
          }
        }
      }
    }

    // 隣接同一マルス名ランの事前マージ
    const preMergedRuns = [];
    for (let i = 0; i < runs.length; i++) {
      const r = runs[i];
      if (preMergedRuns.length > 0) {
        const last = preMergedRuns[preMergedRuns.length - 1];
        if (last.marsName === r.marsName && !last.isShinkansen && !r.isShinkansen) {
          last.to = r.to;
          last.stationIds.push(...r.stationIds.slice(1));
          continue;
        }
      }
      preMergedRuns.push({ ...r, stationIds: [...r.stationIds] });
    }

    // 2. 旅規第70条太線区間（東京付近）通過時の印字省略ルール
    const RULE_70_STATION_NAMES = new Set([
      '東京', '有楽町', '新橋', '浜松町', '田町', '高輪ゲートウェイ', '品川', '大崎', '五反田', '目黒', '恵比寿',
      '渋谷', '原宿', '代々木', '新宿', '新大久保', '高田馬場', '目白', '池袋', '大塚', '巣鴨', '駒込', '田端',
      '西日暮里', '日暮里', '鶯谷', '上野', '御徒町', '秋葉原', '神田',
      '板橋', '十条', '赤羽', '尾久',
      '御茶ノ水', '水道橋', '飯田橋', '市ケ谷', '市ヶ谷', '四ツ谷', '信濃町', '千駄ケ谷', '千駄ヶ谷',
      '浅草橋', '両国', '錦糸町', '新日本橋', '馬喰町'
    ]);

    let filteredRuns = [...preMergedRuns];
    if (!RULE_70_STATION_NAMES.has(deptName) && !RULE_70_STATION_NAMES.has(destName)) {
      const isRule70OmitCandidate = (r) => {
        if (r.isShinkansen) return false;
        const allIn70 = r.stationIds.every(id => {
          const name = stations[id] ? stations[id].name : id;
          return RULE_70_STATION_NAMES.has(name);
        });
        if (!allIn70) return false;
        if (r.lineId === 'yamanote') return true;
        if (r.lineId === 'akabane-line') return true;
        if (r.lineId === 'sobu-main') return true;
        if (r.lineId === 'tokaido') return true;
        if (r.lineId === 'tohoku-main') return true;
        return false;
      };

      const remaining = filteredRuns.filter(r => !isRule70OmitCandidate(r));
      if (remaining.length > 0) {
        filteredRuns = remaining;
      }
    }

    // 3. 特定都区市内・東京山手線内（deptZoneApplied / destZoneApplied）完結区間の省略ルール
    let deptZone = null;
    let destZone = null;
    if (fareRules) {
      const getZoneObj = (applied, zoneName) => {
        if (!applied) return null;
        if (fareRules.deptZone && fareRules.deptZone.displayName === zoneName) return fareRules.deptZone;
        if (fareRules.destZone && fareRules.destZone.displayName === zoneName) return fareRules.destZone;
        for (const z of Object.values(SPECIFIC_CITY_ZONES)) {
          if (z.displayName === zoneName || z.id === applied || z.name === zoneName) return z;
        }
        return null;
      };

      deptZone = getZoneObj(fareRules.deptZoneApplied, fareRules.displayDeptName);
      destZone = getZoneObj(fareRules.destZoneApplied, fareRules.displayDestName);

      // 発側の先頭から連続するゾーン内完結在来線ランの省略 (直後が新幹線ランの場合)
      if (deptZone) {
        while (filteredRuns.length > 1) {
          const first = filteredRuns[0];
          if (first.isShinkansen) break;
          const nextIsShinkansen = filteredRuns[1] && filteredRuns[1].isShinkansen;
          if (!nextIsShinkansen) break;

          const allInZone = first.stationIds.every(id => {
            const name = stations[id] ? stations[id].name : id;
            return isStationInZone(id, name, deptZone, stations);
          });
          if (allInZone) {
            filteredRuns.shift();
          } else {
            break;
          }
        }
      }

      // 着側の末尾から連続するゾーン内完結在来線ランの省略 (直前が新幹線ランの場合)
      if (destZone) {
        while (filteredRuns.length > 1) {
          const last = filteredRuns[filteredRuns.length - 1];
          if (last.isShinkansen) break;
          const prevIsShinkansen = filteredRuns[filteredRuns.length - 2] && filteredRuns[filteredRuns.length - 2].isShinkansen;
          if (!prevIsShinkansen) break;

          const allInZone = last.stationIds.every(id => {
            const name = stations[id] ? stations[id].name : id;
            return isStationInZone(id, name, destZone, stations);
          });
          if (allInZone) {
            filteredRuns.pop();
          } else {
            break;
          }
        }
      }
    }

    // 4. 連続する新幹線ランの統合
    // ※ 東海道新幹線 (shinkansen-tokaido) と東北系新幹線 (shinkansen-tohoku, shinkansen-joetsu, shinkansen-hokuriku 等) の
    // 東京駅乗換は直通運転しないため統合せず、間に東京を挟んで「新幹線・東京・新幹線」と分離印字
    function isTokaidoTohokuTokyoTransfer(r1, r2) {
      if (!r1 || !r2 || !r1.isShinkansen || !r2.isShinkansen) return false;
      const transSt = stations[r1.to] ? stations[r1.to].name : r1.to;
      if (transSt !== '東京') return false;
      const isTokaido = (lid) => lid === 'shinkansen-tokaido';
      const isTohokuSystem = (lid) => lid && lid.startsWith('shinkansen-') && lid !== 'shinkansen-tokaido' && lid !== 'shinkansen-sanyo' && lid !== 'shinkansen-kyushu' && lid !== 'shinkansen-nishi-kyushu';
      return (isTokaido(r1.lineId) && isTohokuSystem(r2.lineId)) || (isTohokuSystem(r1.lineId) && isTokaido(r2.lineId));
    }

    const finalMergedRuns = [];
    for (let i = 0; i < filteredRuns.length; i++) {
      const r = filteredRuns[i];
      if (r.isShinkansen &&
          finalMergedRuns.length > 0 &&
          finalMergedRuns[finalMergedRuns.length - 1].isShinkansen &&
          finalMergedRuns[finalMergedRuns.length - 1].to === r.from &&
          finalMergedRuns[finalMergedRuns.length - 1].from !== r.to &&
          !isTokaidoTohokuTokyoTransfer(finalMergedRuns[finalMergedRuns.length - 1], r)) {
        finalMergedRuns[finalMergedRuns.length - 1].to = r.to;
        finalMergedRuns[finalMergedRuns.length - 1].stationIds.push(...r.stationIds.slice(1));
      } else {
        finalMergedRuns.push({ ...r, stationIds: [...r.stationIds] });
      }
    }

    // 5. マルス経由線リストの組み立て（発着駅・中心駅の新幹線駅名省略）
    const deptCenterName = (fareRules && fareRules.deptZone) ? fareRules.deptZone.centerName : ((fareRules && (fareRules.displayDeptName === '東京都区内' || fareRules.displayDeptName === '東京山手線内')) ? '東京' : null);
    const destCenterName = (fareRules && fareRules.destZone) ? fareRules.destZone.centerName : ((fareRules && (fareRules.displayDestName === '東京都区内' || fareRules.displayDestName === '東京山手線内')) ? '東京' : ((fareRules && fareRules.displayDestName === '京都市内') ? '京都' : null));

    const marsNamesList = [];
    for (let i = 0; i < finalMergedRuns.length; i++) {
      const r = finalMergedRuns[i];
      const deptSt = getMarsStationName(r.from, stations);
      const destSt = getMarsStationName(r.to, stations);

      if (r.isShinkansen) {
        const isFirstRun = (i === 0);
        const isLastRun = (i === finalMergedRuns.length - 1);

        // 乗車駅 (deptSt) の印字判定:
        // 先頭新幹線であり、かつ実発駅または発側ゾーン中心駅または発側ゾーン内新幹線駅と一致する場合のみ省略
        // 途中の在来線⇄新幹線乗換駅は対称に省略せず必ず印字
        let omitDeptStation = false;
        if (isFirstRun) {
          const isDeptInZone = deptZone && isStationInZone(r.from, deptSt, deptZone, stations);
          if (deptSt === deptName || (deptCenterName && deptSt === deptCenterName) || isDeptInZone) {
            omitDeptStation = true;
          }
        }

        if (!omitDeptStation) {
          if (marsNamesList.length === 0 || marsNamesList[marsNamesList.length - 1] !== deptSt) {
            marsNamesList.push(deptSt);
          }
        }

        // 新幹線
        marsNamesList.push('新幹線');

        // 降車駅 (destSt) の印字判定:
        // 末尾新幹線であり、かつ実着駅または着側ゾーン中心駅または着側ゾーン内新幹線駅と一致する場合のみ省略
        // 途中の在来線⇄新幹線乗換駅は対称に省略せず必ず印字
        let omitDestStation = false;
        if (isLastRun) {
          const isDestInZone = destZone && isStationInZone(r.to, destSt, destZone, stations);
          if (destSt === destName || (destCenterName && destSt === destCenterName) || isDestInZone) {
            omitDestStation = true;
          }
        }

        if (!omitDestStation) {
          marsNamesList.push(destSt);
        }
      } else {
        // 在来線区間
        if (marsNamesList.length === 0 || marsNamesList[marsNamesList.length - 1] !== r.marsName) {
          marsNamesList.push(r.marsName);
        }
      }
    }

    // 6. 隣接同一マルス名の圧縮とフォールバック
    const compressedList = [];
    for (const name of marsNamesList) {
      if (compressedList.length === 0 || compressedList[compressedList.length - 1] !== name) {
        compressedList.push(name);
      }
    }

    if (compressedList.length === 0) {
      if (lineRuns.length > 0) {
        compressedList.push(lineRuns[0].marsName);
      } else {
        compressedList.push('(直通)');
      }
    }

    return {
      marsFormatString: compressedList.join('・'),
      marsNamesList: compressedList
    };
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
      tracks = options.tracks || (typeof window !== 'undefined' ? window.JR_TRACKS : null);
      if (!tracks && typeof require !== 'undefined') {
        try {
          tracks = require('./data/tracks.js');
        } catch (e) {}
      }
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
    const deptName = (stations[deptId] && stations[deptId].name) || deptId;
    const destName = (stations[destId] && stations[destId].name) || destId;

    // 旅規第16条の2 同一線扱い新幹線・並行在来線区間 Corridor 定義
    const SAME_LINE_PARALLEL_CORRIDORS = getSameLineParallelCorridors(stations, cachedLines);

    // 新幹線特定区間の探索設定
    const shinkansenSegs = options.shinkansenSegments || [];
    const forceShinkansenOnly = !!options.forceShinkansenOnlyInSegments;

    // 新幹線指定区間を stops に自動統合
    stops = expandStopsWithShinkansen(stops, shinkansenSegs, stations);

    const searchMode = options.searchMode || options.mode || 'shortest';
    const requireOneWay = (searchMode === 'oneway' || searchMode === 'no-overlap');

    const fullSegments = [];
    let hasDuplicate = false;

    // 一周ルート (発着同一駅) の判定
    const isLoopRoute = (stops.length >= 2 && stops[0] === stops[stops.length - 1]);

    // 重複区間なし（一筆書き）探索におけるバックトラック・代替経路探索
    // 前半レグの最短経路が後半レグの唯一のアクセス路を塞いでしまった場合に、
    // 原因となった路線・エッジを特定して前レグの別ルートを再探索する
    const MAX_BACKTRACK_ATTEMPTS = 8;
    let attemptCount = 0;
    let fullLegs = null;
    let lastStuckOrigin = null;
    let lastStuckDest = null;

    const legForbiddenLines = Array.from({ length: stops.length - 1 }, () => new Set());
    const legForbiddenEdges = Array.from({ length: stops.length - 1 }, () => new Set());

    while (attemptCount < MAX_BACKTRACK_ATTEMPTS) {
      attemptCount++;
      const currentVisitedStations = new Set();
      const currentVisitedEdges = new Set();
      const currentLegs = [];
      let stuckLegIdx = -1;
      let dupStationId = null;

      for (let i = 0; i < stops.length - 1; i++) {
        const origin = stops[i];
        const destination = stops[i + 1];

        // このレグが新幹線指定区間かどうか判定 (順方向・逆方向双方に対応)
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

        // 基本制約チェック: 訪問済み駅 + まだ通過していない将来の経由駅および着駅の途中通過を禁止
        const futureStops = new Set();
        const legForbiddenStations = new Set();

        if (requireOneWay) {
          // 1. これまでに訪問した全駅を禁止リストに追加
          currentVisitedStations.forEach(id => legForbiddenStations.add(id));

          // 例外1: 現在の区間の出発駅（直前区間の到着駅＝接続点）は許容
          legForbiddenStations.delete(origin);

          // 2. まだ通過していない将来の経由駅および着駅の途中通過を禁止
          for (let j = i + 2; j < stops.length; j++) {
            const stId = stops[j];
            if (isLoopRoute && j === stops.length - 1 && stId === stops[0]) continue;
            futureStops.add(stId);
            legForbiddenStations.add(stId);
          }

          // 例外2: 最終区間の到着駅が発駅と一致する場合（一周一筆書きルート: deptId === destId のみ終点として再訪問を許可）
          if (isLoopRoute && i === stops.length - 2 && destination === stops[0]) {
            legForbiddenStations.delete(destination);
          }
        }

        if (legForceShinkansen) {
          // 別線新幹線探索時は終点駅および別線接続駅を禁止対象から外す
          legForbiddenStations.delete(destination);
          legForbiddenStations.delete(origin);
        }

        const legForbiddenEdgesMerged = new Set(legForbiddenEdges[i]);
        if (requireOneWay) {
          currentVisitedEdges.forEach(e => legForbiddenEdgesMerged.add(e));

          // 旅規第16条の2 第1項・第16条の3: 原則同一線コリドー（isParagraph2 === false）の並行往復防止
          // 過去レグで新幹線を使った場合は並行在来線エッジを、在来線を使った場合は並行新幹線エッジをブロック
          SAME_LINE_PARALLEL_CORRIDORS.forEach(c => {
            if (c.isParagraph2) return; // 第2項の15区間は探索段階では一律ブロックしない
            let cUsedShinkansen = false;
            let cUsedConventional = false;
            currentLegs.forEach(prevLg => {
              prevLg.forEach(seg => {
                const st1 = stations[seg.from];
                const st2 = stations[seg.to];
                const n1 = st1 ? st1.name : seg.from;
                const n2 = st2 ? st2.name : seg.to;
                const isMatchS = c.shinkansenLines ? c.shinkansenLines.has(seg.lineId) : (seg.lineId === c.shinkansenLine);
                if (isMatchS && c.shinkansenStations.has(n1) && c.shinkansenStations.has(n2)) {
                  cUsedShinkansen = true;
                }
                if (c.conventionalLines.has(seg.lineId) && c.conventionalStations.has(n1) && c.conventionalStations.has(n2)) {
                  cUsedConventional = true;
                }
              });
            });

            if (cUsedShinkansen || cUsedConventional) {
              const edgesObj = getCorridorEdges(graph, stations, c);
              if (cUsedShinkansen) {
                edgesObj.cEdges.forEach(eKey => legForbiddenEdgesMerged.add(eKey));
              }
              if (cUsedConventional) {
                edgesObj.sEdges.forEach(eKey => legForbiddenEdgesMerged.add(eKey));
              }
            }
          });
        }

        const legOptions = {
          allowShinkansen: legAllowShinkansen,
          forceShinkansen: legForceShinkansen,
          forbiddenStations: legForbiddenStations,
          forbiddenLines: legForbiddenLines[i],
          forbiddenEdges: legForbiddenEdgesMerged,
          requireOneWay: requireOneWay
        };

        let leg = null;
        if (requireOneWay) {
          leg = findLeg(graph, origin, destination, legOptions);
          if (!leg && legForceShinkansen) {
            leg = findLeg(graph, origin, destination, {
              ...legOptions,
              allowShinkansen: true,
              forceShinkansen: false
            });
          }
        } else {
          // 最短経路モード: 禁止ノードなしで探索
          leg = findLeg(graph, origin, destination, {
            allowShinkansen: legAllowShinkansen,
            forceShinkansen: legForceShinkansen,
            forbiddenStations: new Set(),
            forbiddenLines: legForbiddenLines[i],
            forbiddenEdges: legForbiddenEdges[i]
          });
          if (!leg && legForceShinkansen) {
            leg = findLeg(graph, origin, destination, {
              allowShinkansen: true,
              forceShinkansen: false,
              forbiddenStations: new Set(),
              forbiddenLines: legForbiddenLines[i],
              forbiddenEdges: legForbiddenEdges[i]
            });
          }
        }

        if (!leg) {
          stuckLegIdx = i;
          lastStuckOrigin = origin;
          lastStuckDest = destination;
          break;
        }

        currentLegs.push(leg);
        leg.forEach(seg => {
          currentVisitedStations.add(seg.from);
          currentVisitedStations.add(seg.to);
          currentVisitedEdges.add(seg.from + '::' + seg.to);
          currentVisitedEdges.add(seg.to + '::' + seg.from);
        });

        // 旅規第16条の2 第1項・第16条の3: 原則同一線コリドー（isParagraph2 === false）の途中駅展開
        // 新幹線で通過した同一線コリドーの並行在来線途中駅（神田・秋葉原・御徒町等）を訪問済み駅として追加し、
        // 次レグ以降でその駅を通る8の字交差を禁止
        if (requireOneWay) {
          SAME_LINE_PARALLEL_CORRIDORS.forEach(c => {
            if (c.isParagraph2) return;
            let usedS = false;
            let usedC = false;
            leg.forEach(seg => {
              const st1 = stations[seg.from];
              const st2 = stations[seg.to];
              const n1 = st1 ? st1.name : seg.from;
              const n2 = st2 ? st2.name : seg.to;
              const isMatchS = c.shinkansenLines ? c.shinkansenLines.has(seg.lineId) : (seg.lineId === c.shinkansenLine);
              if (isMatchS && c.shinkansenStations.has(n1) && c.shinkansenStations.has(n2)) {
                usedS = true;
              }
              if (c.conventionalLines.has(seg.lineId) && c.conventionalStations.has(n1) && c.conventionalStations.has(n2)) {
                usedC = true;
              }
            });
            if (usedS && c.conventionalIntermediateStationIds) {
              c.conventionalIntermediateStationIds.forEach(id => currentVisitedStations.add(id));
            }
            if (usedC && c.shinkansenIntermediateStationIds) {
              c.shinkansenIntermediateStationIds.forEach(id => currentVisitedStations.add(id));
            }
          });
        }
      }

      if (stuckLegIdx === -1) {
        if (requireOneWay && currentLegs.length > 1) {
          // 全レグ結合時の一筆書き・重複チェック (新在別線・ノード重複・コリドー重複)
          const testFullSegments = [];
          currentLegs.forEach(leg => leg.forEach(s => testFullSegments.push(s)));
          const testStationIds = [testFullSegments[0].from, ...testFullSegments.map(s => s.to)];
          const testStationCounts = new Map();
          testStationIds.forEach(id => testStationCounts.set(id, (testStationCounts.get(id) || 0) + 1));

          let hasDup = false;
          dupStationId = null;
          const originId = stops[0];
          const isLoop = (testStationIds.length >= 2 && testStationIds[0] === testStationIds[testStationIds.length - 1]);

          for (const [id, count] of testStationCounts.entries()) {
            if (isLoop && id === originId) {
              if (count > 2) { hasDup = true; dupStationId = id; break; }
            } else {
              if (count > 1) { hasDup = true; dupStationId = id; break; }
            }
          }

          if (!hasDup) {
            const corrSMap = new Map();
            testFullSegments.forEach(seg => {
              const n1 = stations[seg.from]?.name || seg.from;
              const n2 = stations[seg.to]?.name || seg.to;
              SAME_LINE_PARALLEL_CORRIDORS.forEach(c => {
                const isMatchS = c.shinkansenLines ? c.shinkansenLines.has(seg.lineId) : (seg.lineId === c.shinkansenLine);
                if (isMatchS && c.shinkansenStations.has(n1) && c.shinkansenStations.has(n2)) {
                  corrSMap.set(c.id, (corrSMap.get(c.id) || 0) + 1);
                }
              });
            });

            for (const c of SAME_LINE_PARALLEL_CORRIDORS) {
              if (c.isParagraph2) continue;
              const hasS = (corrSMap.get(c.id) || 0) > 0;
              if (hasS && c.conventionalIntermediateStationIds) {
                for (const stId of c.conventionalIntermediateStationIds) {
                  if (testStationIds.includes(stId)) {
                    hasDup = true;
                    dupStationId = stId;
                    break;
                  }
                }
              }
              if (hasDup) break;
            }
          }


          if (hasDup) {
            // 重複区間なし（requireOneWay）モードでは、結合時に重複がある場合は確定させずバックトラックで別ルートを探索
            stuckLegIdx = currentLegs.length - 1;
            lastStuckOrigin = stops[stuckLegIdx];
            lastStuckDest = stops[stuckLegIdx + 1];
          } else {
            fullLegs = currentLegs;
            break;
          }
        } else {
          // 全レグ探索成功！ (初回成功時は Fast Path で追加コストゼロ)
          fullLegs = currentLegs;
          break;
        }
      }

      // 最短経路モードの場合はバックトラックせず終了
      if (!requireOneWay) {
        break;
      }

      // --- バックトラック・原因区間特定 (逆算チェック) ---
      const stuckOrigin = stops[stuckLegIdx];
      const stuckDest = stops[stuckLegIdx + 1];

      // 1. レグ stuckLegIdx を過去の訪問済み制約なしで探索 (理想ルートの取得)
      const futureStopsOnly = new Set();
      for (let j = stuckLegIdx + 2; j < stops.length; j++) {
        const stId = stops[j];
        if (isLoopRoute && j === stops.length - 1 && stId === stops[0]) continue;
        futureStopsOnly.add(stId);
      }

      const idealLeg = findLeg(graph, stuckOrigin, stuckDest, {
        allowShinkansen: (options.useShinkansen !== undefined) ? options.useShinkansen : (options.allowShinkansen !== false),
        forbiddenStations: futureStopsOnly,
        requireOneWay: true
      });

      if (!idealLeg) {
        // 制約なしでも到達不能な場合は救済不能
        break;
      }

      // 2. 理想ルートで使用されている路線・エッジ・ノードを特定
      const idealLines = new Set(idealLeg.map(s => s.lineId));
      const idealEdges = new Set();
      const idealNodes = new Set();
      idealLeg.forEach(s => {
        idealEdges.add(s.from + '::' + s.to);
        idealEdges.add(s.to + '::' + s.from);
        if (s.from !== stuckOrigin && s.from !== stuckDest) idealNodes.add(s.from);
        if (s.to !== stuckOrigin && s.to !== stuckDest) idealNodes.add(s.to);
      });

      // 3. 直前のレグから順に過去レグ (p = stuckLegIdx - 1 .. 0) を逆順スキャンし、衝突要素を前レグで除外
      let conflictResolved = false;
      const sortedIdealLines = Array.from(idealLines);

      for (let p = stuckLegIdx - 1; p >= 0 && !conflictResolved; p--) {
        const prevLeg = currentLegs[p];
        if (!prevLeg) continue;

        const prevLines = new Set(prevLeg.map(s => s.lineId));
        const conflictLines = [];
        sortedIdealLines.forEach(l => {
          if (prevLines.has(l) && !conflictLines.includes(l)) conflictLines.push(l);
        });

        let anyAdded = false;
        for (const lineId of conflictLines) {
          if (!legForbiddenLines[p].has(lineId)) {
            legForbiddenLines[p].add(lineId);
            anyAdded = true;
          }
        }
        if (anyAdded) {
          conflictResolved = true;
        }

        if (!conflictResolved) {
          // 路線レベルで共通がない場合、共有エッジを探して禁止
          const commonEdges = prevLeg.filter(s => idealEdges.has(s.from + '::' + s.to));
          for (const edgeSeg of commonEdges) {
            const eKey = edgeSeg.from + '::' + edgeSeg.to;
            if (!legForbiddenEdges[p].has(eKey)) {
              legForbiddenEdges[p].add(eKey);
              conflictResolved = true;
              break;
            }
          }
        }

        if (!conflictResolved) {
          // エッジレベルでも共通がない場合、共有ノード（駅）を探して前レグでその駅を通るエッジを禁止
          const prevNodes = new Set();
          prevLeg.forEach(s => {
            if (s.from !== stops[p] && s.from !== stops[p + 1]) prevNodes.add(s.from);
            if (s.to !== stops[p] && s.to !== stops[p + 1]) prevNodes.add(s.to);
          });
          const commonNodes = Array.from(prevNodes).filter(id => idealNodes.has(id));
          for (const nodeId of commonNodes) {
            const connectedEdges = prevLeg.filter(s => s.from === nodeId || s.to === nodeId);
            for (const edgeSeg of connectedEdges) {
              const eKey = edgeSeg.from + '::' + edgeSeg.to;
              if (!legForbiddenEdges[p].has(eKey)) {
                legForbiddenEdges[p].add(eKey);
                conflictResolved = true;
              }
            }
            if (conflictResolved) break;
          }
        }

        if (!conflictResolved && dupStationId) {
          const connectedEdges = prevLeg.filter(s => s.from === dupStationId || s.to === dupStationId);
          for (const edgeSeg of connectedEdges) {
            const eKey = edgeSeg.from + '::' + edgeSeg.to;
            if (!legForbiddenEdges[p].has(eKey)) {
              legForbiddenEdges[p].add(eKey);
              conflictResolved = true;
            }
          }
        }

        if (conflictResolved) {
          // 過去レグ p の制約を変更したため、p より後ろのレグのオーバーライドをリセットして再試行
          for (let r = p + 1; r < stops.length - 1; r++) {
            legForbiddenLines[r].clear();
            legForbiddenEdges[r].clear();
          }
        }
      }

      if (!conflictResolved) {
        // これ以上除外できる衝突要素がない場合は終了
        break;
      }
    }

    if (!fullLegs || fullLegs.length === 0) {
      const originName = (stations[lastStuckOrigin] && stations[lastStuckOrigin].name) || lastStuckOrigin;
      const destName = (stations[lastStuckDest] && stations[lastStuckDest].name) || lastStuckDest;
      const msg = requireOneWay
        ? `「${originName}」から「${destName}」への重複区間なし（一筆書き）ルートが見つかりませんでした。「最短経路」をお試しください。`
        : `「${originName}」から「${destName}」への経路が見つかりませんでした。`;
      return { success: false, error: msg };
    }

    fullLegs.forEach(leg => {
      leg.forEach(seg => {
        fullSegments.push(seg);
      });
    });

    if (fullSegments.length === 0) {
      return { success: false, error: '有効な経路が見つかりませんでした。' };
    }

    // エッジごとの通過回数集計 (無向エッジとして同一区間の往復または重複通過を検出)
    // 2026年3月改定対応:
    // - 東海道新幹線と東海道本線の東京〜熱海間は完全別線扱いのため、乗り分け往復は「重複なし」として許可
    // - 熱海〜新大阪間および東北・山陽・上越・九州・西九州の同一線区間は同一線扱い
    const edgeCountMap = new Map();
    const corridorShinkansenMap = new Map();
    const corridorConventionalMap = new Map();

    fullSegments.forEach(seg => {
      const sepTrackType = getSeparateShinkansenTrackType(seg);
      const trackType = sepTrackType || 'standard';
      const idKey = seg.from < seg.to ? `${trackType}::${seg.from}::${seg.to}` : `${trackType}::${seg.to}::${seg.from}`;
      edgeCountMap.set(idKey, (edgeCountMap.get(idKey) || 0) + 1);

      const st1 = stations[seg.from];
      const st2 = stations[seg.to];
      const n1 = st1 ? st1.name : seg.from;
      const n2 = st2 ? st2.name : seg.to;
      if (n1 !== n2) {
        const nameKey = n1 < n2 ? `name::${trackType}::${n1}::${n2}` : `name::${trackType}::${n2}::${n1}`;
        edgeCountMap.set(nameKey, (edgeCountMap.get(nameKey) || 0) + 1);
      }

      // 2. 同一線扱い区間 (Corridor) の集計
      SAME_LINE_PARALLEL_CORRIDORS.forEach(c => {
        const isMatchShinkansen = c.shinkansenLines ? c.shinkansenLines.has(seg.lineId) : (seg.lineId === c.shinkansenLine);
        if (isMatchShinkansen && c.shinkansenStations.has(n1) && c.shinkansenStations.has(n2)) {
          corridorShinkansenMap.set(c.id, (corridorShinkansenMap.get(c.id) || 0) + 1);
        } else if (c.conventionalLines.has(seg.lineId) && c.conventionalStations.has(n1) && c.conventionalStations.has(n2)) {
          corridorConventionalMap.set(c.id, (corridorConventionalMap.get(c.id) || 0) + 1);
        }
      });
    });

    let hasDuplicateEdges = false;
    fullSegments.forEach(seg => {
      const sepTrackType = getSeparateShinkansenTrackType(seg);
      const trackType = sepTrackType || 'standard';
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
        // 同一線新幹線と並行在来線の両方を通過した場合の判定
        if (hasShinkansen && hasConventional) {
          let duplicateForCorridor = false;
          if (!c.isParagraph2) {
            // 原則同一線区間 (第16条の2 第1項 ＋ 第16条の3): 無条件で重複
            duplicateForCorridor = true;
          } else {
            // 第16条の2 第2項（条件付き別線15区間）:
            // 途中駅発着 (cond1) または 途中駅での他線接続 (cond2) があれば別線 (重複なし)
            const endSet = new Set(c.endpoints);
            const intermediateStations = new Set();
            c.shinkansenStations.forEach(name => { if (!endSet.has(name)) intermediateStations.add(name); });
            c.conventionalStations.forEach(name => { if (!endSet.has(name)) intermediateStations.add(name); });

            const cond1 = intermediateStations.has(deptName) || intermediateStations.has(destName);
            let cond2 = false;
            const isLineInCorridor = (lid) => (c.shinkansenLines.has(lid) || c.conventionalLines.has(lid));

            for (let k = 0; k < fullSegments.length - 1; k++) {
              const s1 = fullSegments[k];
              const s2 = fullSegments[k + 1];
              const transSt = stations[s1.to];
              const transName = transSt ? transSt.name : s1.to;
              if (intermediateStations.has(transName)) {
                if ((isLineInCorridor(s1.lineId) && !isLineInCorridor(s2.lineId)) ||
                    (!isLineInCorridor(s1.lineId) && isLineInCorridor(s2.lineId))) {
                  cond2 = true;
                  break;
                }
              }
            }

            if (!cond1 && !cond2) {
              duplicateForCorridor = true;
            }
          }

          if (duplicateForCorridor) {
            const isMatchShinkansen = c.shinkansenLines ? c.shinkansenLines.has(seg.lineId) : (seg.lineId === c.shinkansenLine);
            if (isMatchShinkansen && c.shinkansenStations.has(n1) && c.shinkansenStations.has(n2)) {
              isCorridorDuplicate = true;
            } else if (c.conventionalLines.has(seg.lineId) && c.conventionalStations.has(n1) && c.conventionalStations.has(n2)) {
              isCorridorDuplicate = true;
            }
          }
        }
      });

      seg.isDuplicate = (idCount > 1 || nameCount > 1 || isCorridorDuplicate);
      if (seg.isDuplicate) hasDuplicateEdges = true;
    });

    // 通過全駅IDリスト
    const allStationIds = [fullSegments[0].from, ...fullSegments.map(s => s.to)];

    // 各駅の出現回数集計
    // 旅規第68条: 片道乗車券は環状線一周となるものを除き、折り返し又は同一駅を2度以上通過しないこと
    // エッジ（区間）の重複がない場合でも、発着一致（一周）以外の途中駅が2回以上出現している場合（8の字交差等）は重複あり（成立不可）
    // ※東京〜熱海、新下関〜博多の新在別線駅（東京・品川・新横浜・小田原・熱海・新下関・小倉・博多）や他線接続駅（古川・新花巻・新鳥栖等）であっても、
    //   同一物理駅を途中駅として2回通る8の字交差は、通常のノード重複チェックで引き続き不成立とする（発着一致の一周を除く）
    const stationCountMap = new Map();
    for (let sIdx = 0; sIdx < allStationIds.length; sIdx++) {
      const stId = allStationIds[sIdx];
      stationCountMap.set(stId, (stationCountMap.get(stId) || 0) + 1);
    }

    const duplicateStationIds = [];
    const originId = stops[0];
    const isLoop = (allStationIds.length >= 2 && allStationIds[0] === allStationIds[allStationIds.length - 1]);

    stationCountMap.forEach((count, id) => {
      if (isLoop && id === originId) {
        if (count > 2) {
          duplicateStationIds.push(id);
        } else if (count === 2) {
          const firstIdx = allStationIds.indexOf(id);
          const lastIdx = allStationIds.lastIndexOf(id);
          if (firstIdx !== 0 || lastIdx !== allStationIds.length - 1) {
            duplicateStationIds.push(id);
          }
        }
      } else {
        if (count > 1) {
          duplicateStationIds.push(id);
        }
      }
    });

    // 新幹線同一線区間の並行在来線途中駅との8の字交差判定
    // 経路中で新幹線を利用したコリドーが同一線扱い（isParagraph2 === false、または isParagraph2 === true かつ条件不成立）の場合、
    // 並行在来線の全途中駅は新幹線利用によりすでに通過したものとみなされる。
    // その途中駅が allStationIds（在来線側）に現れている場合、駅の2度通過（8の字交差）として重複判定する。
    SAME_LINE_PARALLEL_CORRIDORS.forEach(c => {
      const hasShinkansen = (corridorShinkansenMap.get(c.id) || 0) > 0;
      const hasConventional = (corridorConventionalMap.get(c.id) || 0) > 0;
      if (!hasShinkansen && !hasConventional) return;

      let isSameLine = false;
      if (!c.isParagraph2) {
        isSameLine = true;
      } else {
        // 第2項条件判定 (cond1, cond2)
        const endSet = new Set(c.endpoints);
        const intermediateStations = new Set();
        c.shinkansenStations.forEach(name => { if (!endSet.has(name)) intermediateStations.add(name); });
        c.conventionalStations.forEach(name => { if (!endSet.has(name)) intermediateStations.add(name); });

        const cond1 = intermediateStations.has(deptName) || intermediateStations.has(destName);
        let cond2 = false;
        const isLineInCorridor = (lid) => (c.shinkansenLines.has(lid) || c.conventionalLines.has(lid));

        for (let k = 0; k < fullSegments.length - 1; k++) {
          const s1 = fullSegments[k];
          const s2 = fullSegments[k + 1];
          const transSt = stations[s1.to];
          const transName = transSt ? transSt.name : s1.to;
          if (intermediateStations.has(transName)) {
            if ((isLineInCorridor(s1.lineId) && !isLineInCorridor(s2.lineId)) ||
                (!isLineInCorridor(s1.lineId) && isLineInCorridor(s2.lineId))) {
              cond2 = true;
              break;
            }
          }
        }
        if (!cond1 && !cond2) {
          isSameLine = true;
        }
      }

      if (hasShinkansen && isSameLine && c.conventionalIntermediateStationIds) {
        c.conventionalIntermediateStationIds.forEach(stId => {
          if (allStationIds.includes(stId)) {
            if (!duplicateStationIds.includes(stId)) {
              duplicateStationIds.push(stId);
            }
          }
        });
      }

      if (hasConventional && isSameLine && c.shinkansenIntermediateStationIds) {
        c.shinkansenIntermediateStationIds.forEach(stId => {
          if (allStationIds.includes(stId)) {
            if (!duplicateStationIds.includes(stId)) {
              duplicateStationIds.push(stId);
            }
          }
        });
      }
    });

    // 純粋な駅交差（8の字交差: 例 秋葉原、古川）のセグメント重複マーク
    // その重複駅を発着するセグメントのうち、すでに isDuplicate が付いているセグメントが1つもない場合のみ、
    // その駅で交差しているセグメントに seg.isDuplicate = true を付与する
    // （すでにコリドー重複やエッジ重複の端点として赤くなっている駅に接続するだけの無関係な路線には付与しない）
    duplicateStationIds.forEach(stId => {
      const connectedSegs = fullSegments.filter(seg => seg.from === stId || seg.to === stId);
      const alreadyHasDuplicate = connectedSegs.some(seg => seg.isDuplicate);
      if (!alreadyHasDuplicate) {
        connectedSegs.forEach(seg => {
          seg.isDuplicate = true;
        });
      }
    });

    hasDuplicate = hasDuplicateEdges || (duplicateStationIds.length > 0);

    if (requireOneWay && hasDuplicate) {
      return {
        success: false,
        error: `「${deptName}」から「${destName}」への重複区間なし（一筆書き）ルートが見つかりませんでした。「最短経路」をお試しください。`
      };
    }

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
          segments: [seg],
          distTenths: segTenths,
          dist: segTenths / 10,
          hasDuplicate: !!seg.isDuplicate,
          isEstimated: !!seg.isEstimated
        });
      } else {
        const last = lineRuns[lineRuns.length - 1];
        last.to = seg.to;
        last.stationIds.push(seg.to);
        if (!last.segments) last.segments = [];
        last.segments.push(seg);
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
      const cleaned = cleanPolylineSpikes(chain);
      if (cleaned.length === 0) return;
      if (type === 'duplicate') duplicatePolylines.push(cleaned);
      else if (type === 'shinkansen') shinkansenPolylines.push(cleaned);
      else normalPolylines.push(cleaned);
    }

    if (tracks) {
      let currentChain = [];
      let currentType = null;

      for (let s = 0; s < fullSegments.length; s++) {
        const seg = fullSegments[s];
        const coords = getSegmentCoords(tracks, stations, seg.lineId, seg.from, seg.to, cachedLines);
        seg.coords = coords;
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
    const sections = lineRuns.map(r => {
      const secCoords = [];
      (r.segments || []).forEach(seg => {
        if (seg.coords && seg.coords.length > 0) {
          if (secCoords.length > 0) {
            secCoords.push(...seg.coords.slice(1));
          } else {
            secCoords.push(...seg.coords);
          }
        }
      });
      return {
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
        coords: cleanPolylineSpikes(secCoords),
        isDuplicate: !!r.hasDuplicate,
        isEstimated: !!r.isEstimated
      };
    });

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
    let isArticle70Applied = false;
    let article70ShortenKm = 0;
    const isInternalCheck = !!options._isInternalCheck;

    if (!isInternalCheck && deptName && destName) {
      const deptInRule70 = RULE_70_STATION_NAMES.has(deptName);
      const destInRule70 = RULE_70_STATION_NAMES.has(destName);

      // 発着駅がどちらも第70条太線区間外にある場合のみ適用
      if (!deptInRule70 && !destInRule70) {
        const akabaneSt = Object.values(stations).find(s => s && s.name === '赤羽');
        const inZoneMoves = [];

        for (let s = 0; s < fullSegments.length; s++) {
          const seg = fullSegments[s];
          const sFrom = stations[seg.from] ? stations[seg.from].name : seg.from;
          const sTo = stations[seg.to] ? stations[seg.to].name : seg.to;

          // 東海道新幹線（shinkansen-tokaido）は旅規第70条注記により太線区間から完全に除外
          if (seg.lineId === 'shinkansen-tokaido' || seg.lineName === '東海道新幹線') {
            continue;
          }

          if (seg.isShinkansen || (seg.lineId && seg.lineId.startsWith('shinkansen-'))) {
            // 東北・上越・北陸新幹線
            // 東京〜大宮, 上野〜大宮の赤羽境界補正
            if (akabaneSt) {
              if (sFrom === '大宮' && sTo === '東京') {
                inZoneMoves.push({ fromId: akabaneSt.id, toId: seg.to, fromName: '赤羽', toName: '東京', km: 13.2 });
              } else if (sFrom === '東京' && sTo === '大宮') {
                inZoneMoves.push({ fromId: seg.from, toId: akabaneSt.id, fromName: '東京', toName: '赤羽', km: 13.2 });
              } else if (sFrom === '大宮' && sTo === '上野') {
                inZoneMoves.push({ fromId: akabaneSt.id, toId: seg.to, fromName: '赤羽', toName: '上野', km: 9.6 });
              } else if (sFrom === '上野' && sTo === '大宮') {
                inZoneMoves.push({ fromId: seg.from, toId: akabaneSt.id, fromName: '上野', toName: '赤羽', km: 9.6 });
              } else if (RULE_70_STATION_NAMES.has(sFrom) && RULE_70_STATION_NAMES.has(sTo)) {
                inZoneMoves.push({ fromId: seg.from, toId: seg.to, fromName: sFrom, toName: sTo, km: seg.dist });
              }
            } else if (RULE_70_STATION_NAMES.has(sFrom) && RULE_70_STATION_NAMES.has(sTo)) {
              inZoneMoves.push({ fromId: seg.from, toId: seg.to, fromName: sFrom, toName: sTo, km: seg.dist });
            }
          } else {
            // 在来線セグメント: 両端が太線区間内の駅であるもの
            if (RULE_70_STATION_NAMES.has(sFrom) && RULE_70_STATION_NAMES.has(sTo)) {
              inZoneMoves.push({ fromId: seg.from, toId: seg.to, fromName: sFrom, toName: sTo, km: seg.dist });
            }
          }
        }

        // 連続する太線区間走行をブロックにまとめる
        const blocks = [];
        let currentBlock = null;

        for (const move of inZoneMoves) {
          if (!currentBlock) {
            currentBlock = {
              entryStId: move.fromId,
              entryStName: move.fromName,
              exitStId: move.toId,
              exitStName: move.toName,
              actualKm: move.km
            };
          } else if (currentBlock.exitStId === move.fromId) {
            currentBlock.exitStId = move.toId;
            currentBlock.exitStName = move.toName;
            currentBlock.actualKm = Math.round((currentBlock.actualKm + move.km) * 10) / 10;
          } else {
            blocks.push(currentBlock);
            currentBlock = {
              entryStId: move.fromId,
              entryStName: move.fromName,
              exitStId: move.toId,
              exitStName: move.toName,
              actualKm: move.km
            };
          }
        }
        if (currentBlock) {
          blocks.push(currentBlock);
        }

        let totalShortenKm = 0;
        for (const block of blocks) {
          if (block.entryStId === block.exitStId) continue;

          let shortestKm = 0;
          try {
            const shortestLeg = findLeg(graph, block.entryStId, block.exitStId, {
              allowShinkansen: false,
              useShinkansen: false
            });
            if (shortestLeg && shortestLeg.length > 0) {
              const sTenths = shortestLeg.reduce((sum, seg) => sum + Math.round(seg.dist * 10), 0);
              shortestKm = sTenths / 10;
            }
          } catch (e) {
            console.warn('Rule 70 dynamic shortest calculation failed for block:', e);
          }

          const actualKm = Math.round(block.actualKm * 10) / 10;
          if (shortestKm > 0 && shortestKm < actualKm) {
            const diffKm = Math.round((actualKm - shortestKm) * 10) / 10;
            totalShortenKm = Math.round((totalShortenKm + diffKm) * 10) / 10;
          }
        }

        if (totalShortenKm > 0) {
          effectiveTotalKm = Math.round((totalDist - totalShortenKm) * 10) / 10;
          isArticle70Applied = true;
          article70ShortenKm = totalShortenKm;
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
        article70Applied: isArticle70Applied,
        article70ShortenKm: article70ShortenKm,
        success: true
      }, stations, cachedLines || [], options);
    }

    // 実物マルス経由印字フォーマッタの適用（唯一の経由文字列生成元）
    let finalMarsString = '';
    let finalMarsNamesList = [];
    try {
      const ticketVia = buildMarsTicketViaString(lineRuns, fareRules, deptName, destName, stations, fullSegments, options);
      if (ticketVia && ticketVia.marsFormatString) {
        finalMarsString = ticketVia.marsFormatString;
        finalMarsNamesList = ticketVia.marsNamesList;
      }
    } catch (e) {
      console.warn('buildMarsTicketViaString failed, falling back:', e);
      finalMarsNamesList = lineRuns.map(r => r.marsName || r.lineName).filter(Boolean);
      finalMarsString = finalMarsNamesList.join('・');
    }

    // 適用特例バッジ (parallelRuleBadges) の生成
    const parallelRuleBadges = [];
    if (!hasDuplicate) {
      // 1. 完全別線区間 (東京〜熱海、新下関〜博多)
      const hasTokaidoShinkansenSep = fullSegments.some(s => getSeparateShinkansenTrackType(s) === 'tokaido-shinkansen');
      const hasTokaidoConvSep = fullSegments.some(s => {
        if (s.lineId !== 'tokaido') return false;
        const n1 = stations[s.from]?.name || s.from;
        const n2 = stations[s.to]?.name || s.to;
        return TOKAIDO_CONV_SEPARATE_NAMES.has(n1) || TOKAIDO_CONV_SEPARATE_NAMES.has(n2);
      });
      if (hasTokaidoShinkansenSep && hasTokaidoConvSep) {
        parallelRuleBadges.push({
          type: 'full-separate',
          label: '完全別線適用（東京〜熱海）',
          detail: '運賃水準差により新幹線と在来線が完全別線扱い（選択乗車不可）'
        });
      }

      const hasSanyoShinkansenSep = fullSegments.some(s => getSeparateShinkansenTrackType(s) === 'sanyo-shinkansen-west');
      const hasSanyoConvSep = fullSegments.some(s => {
        if (s.lineId !== 'sanyo-main' && s.lineId !== 'kyushu-kagoshima' && s.lineId !== 'kyushu-sanyo') return false;
        const n1 = stations[s.from]?.name || s.from;
        const n2 = stations[s.to]?.name || s.to;
        return SANYO_CONV_SEPARATE_NAMES.has(n1) || SANYO_CONV_SEPARATE_NAMES.has(n2);
      });
      if (hasSanyoShinkansenSep && hasSanyoConvSep) {
        parallelRuleBadges.push({
          type: 'full-separate',
          label: '完全別線適用（新下関〜博多）',
          detail: '運賃水準差により新幹線と在来線が完全別線扱い（選択乗車不可）'
        });
      }

      // 2. 新在別線適用 (旅規第16条の2 第2項 15区間) & 3. 選択乗車可能区間 (旅規第157条)
      const allStationNames = new Set(allStationIds.map(id => stations[id]?.name || id));
      const optionalRidingNames = [];
      SAME_LINE_PARALLEL_CORRIDORS.forEach(c => {
        if (!c.isParagraph2) return;
        const hasShinkansen = (corridorShinkansenMap.get(c.id) || 0) > 0;
        const hasConventional = (corridorConventionalMap.get(c.id) || 0) > 0;
        const corridorName = `${c.endpoints[0]}〜${c.endpoints[1]}`;

        if (hasShinkansen && hasConventional) {
          // 両方通過し、途中駅発着または他線接続で成立した場合
          const endSet = new Set(c.endpoints);
          const intermediateStations = new Set();
          c.shinkansenStations.forEach(name => { if (!endSet.has(name)) intermediateStations.add(name); });
          c.conventionalStations.forEach(name => { if (!endSet.has(name)) intermediateStations.add(name); });
          const cond1 = intermediateStations.has(deptName) || intermediateStations.has(destName);
          let cond2 = false;
          const isLineInCorridor = (lid) => (c.shinkansenLines.has(lid) || c.conventionalLines.has(lid));
          for (let k = 0; k < fullSegments.length - 1; k++) {
            const s1 = fullSegments[k];
            const s2 = fullSegments[k + 1];
            const transSt = stations[s1.to];
            const transName = transSt ? transSt.name : s1.to;
            if (intermediateStations.has(transName)) {
              if ((isLineInCorridor(s1.lineId) && !isLineInCorridor(s2.lineId)) ||
                  (!isLineInCorridor(s1.lineId) && isLineInCorridor(s2.lineId))) {
                cond2 = true;
                break;
              }
            }
          }
          if (cond1 || cond2) {
            parallelRuleBadges.push({
              type: 'shin-zai-bessen',
              label: `新在別線適用（${corridorName}）`,
              detail: '旅規第16条の2第2項により途中駅発着・他線接続のため新幹線と在来線を別線として扱い一筆書き成立'
            });
          }
        } else if (hasShinkansen || hasConventional) {
          // 片側のみ通過（選択乗車可能区間: 当該区間の両端駅を両方通過している場合のみ対象）
          if (allStationNames.has(c.endpoints[0]) && allStationNames.has(c.endpoints[1])) {
            optionalRidingNames.push(corridorName);
          }
        }
      });

      if (optionalRidingNames.length > 0) {
        const displayNames = optionalRidingNames.length > 3
          ? `${optionalRidingNames.slice(0, 3).join('・')} 等`
          : optionalRidingNames.join('・');
        parallelRuleBadges.push({
          type: 'optional-riding',
          label: `選択乗車可（${displayNames}）`,
          detail: '旅規第157条により並行する新幹線・在来線のどちらの経路も選択乗車可能'
        });
      }
    }

    return {
      success: true,
      deptId: deptId,
      destId: destId,
      deptName: deptName,
      destName: destName,
      viaIds: viaIds,
      marsString: finalMarsString,
      totalKm: effectiveTotalKm,
      directShortestKm: directShortestKm,
      actualKm: Math.round(totalDist * 10) / 10,
      hasEstimatedDistance: hasEstimatedDistance,
      unregisteredLines: unregisteredLines,
      isOneWayTrip: !hasDuplicate,
      isLoopRoute: isLoopRoute,
      article70Applied: isArticle70Applied,
      article70ShortenKm: article70ShortenKm,
      fareRules: fareRules,
      parallelRuleBadges: parallelRuleBadges,
      sections: sections,
      fullSegments: fullSegments,
      geometryLatlngs: cleanPolylineSpikes(geometryLatlngs),
      normalPolylines: normalPolylines,
      shinkansenPolylines: shinkansenPolylines,
      duplicatePolylines: duplicatePolylines,
      passedLineIds: passedLineIds,

      // 従来互換フィールド
      isOneWay: !hasDuplicate,
      stops: stops,
      marsFormat: finalMarsString,
      marsNamesList: finalMarsNamesList,
      totalDist: effectiveTotalKm,
      lineRuns: lineRuns,
      allStationIds: allStationIds,
      duplicateStationIds: duplicateStationIds
    };
  }

  // グローバルエクスポート
  const RouteEngine = {
    MARS_LINE_NAMES,
    MARS_DUPLICATE_STATION_MAP,
    getMarsLineName,
    getMarsStationName,
    buildGraph,
    findLeg,
    getSegmentCoords,
    getLineTrackGraph,
    findTrackShortestPath,
    offsetLineMeters,
    buildMarsTicketViaString,
    searchMarsRoute
  };

  if (typeof window !== 'undefined') {
    window.JR_ROUTE_ENGINE = RouteEngine;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = RouteEngine;
  }
})();
