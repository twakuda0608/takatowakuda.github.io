// 麻雀牌レンダリングエンジン
// 本物の麻雀牌を忠実に再現した公式ベクターSVG（CC0 / Public Domain）を使用

const TILE_MAP = {
  // 萬子
  '1m': 'Man1.svg', '2m': 'Man2.svg', '3m': 'Man3.svg', '4m': 'Man4.svg',
  '5m': 'Man5.svg', '0m': 'Man5-Dora.svg', '6m': 'Man6.svg', '7m': 'Man7.svg',
  '8m': 'Man8.svg', '9m': 'Man9.svg',
  // 筒子
  '1p': 'Pin1.svg', '2p': 'Pin2.svg', '3p': 'Pin3.svg', '4p': 'Pin4.svg',
  '5p': 'Pin5.svg', '0p': 'Pin5-Dora.svg', '6p': 'Pin6.svg', '7p': 'Pin7.svg',
  '8p': 'Pin8.svg', '9p': 'Pin9.svg',
  // 索子
  '1s': 'Sou1.svg', '2s': 'Sou2.svg', '3s': 'Sou3.svg', '4s': 'Sou4.svg',
  '5s': 'Sou5.svg', '0s': 'Sou5-Dora.svg', '6s': 'Sou6.svg', '7s': 'Sou7.svg',
  '8s': 'Sou8.svg', '9s': 'Sou9.svg',
  // 字牌
  '1z': 'Ton.svg',   // 東
  '2z': 'Nan.svg',   // 南
  '3z': 'Shaa.svg',  // 西
  '4z': 'Pei.svg',   // 北
  '5z': 'Haku.svg',  // 白
  '6z': 'Hatsu.svg', // 發
  '7z': 'Chun.svg',  // 中
};

const TILE_NAMES = {
  '1m': '一萬', '2m': '二萬', '3m': '三萬', '4m': '四萬', '5m': '五萬', '0m': '赤五萬',
  '6m': '六萬', '7m': '七萬', '8m': '八萬', '9m': '九萬',
  '1p': '一筒', '2p': '二筒', '3p': '三筒', '4p': '四筒', '5p': '五筒', '0p': '赤五筒',
  '6p': '六筒', '7p': '七筒', '8p': '八筒', '9p': '九筒',
  '1s': '一索', '2s': '二索', '3s': '三索', '4s': '四索', '5s': '五索', '0s': '赤五索',
  '6s': '六索', '7s': '七索', '8s': '八索', '9s': '九索',
  '1z': '東', '2z': '南', '3z': '西', '4z': '北', '5z': '白', '6z': '發', '7z': '中',
};

// 単一牌のHTML要素を生成
export function renderTile(code, options = {}) {
  const { isAgari = false, agariLabel = '', isNaki = false } = options;

  if (code === 'back') {
    return `
      <span class="mj-tile mj-tile-back" aria-hidden="true">
        <img
          src="./tiles/Back.svg"
          class="mj-tile-img mj-tile-img-back"
          alt=""
          loading="lazy"
          width="28"
          height="37"
          draggable="false"
        />
      </span>
    `;
  }

  const fileName = TILE_MAP[code] || 'Front.svg';

  return `
    <span class="mj-tile${isAgari ? ' mj-tile-agari' : ''}${isNaki ? ' mj-tile-naki' : ''}">
      ${isAgari && agariLabel ? `<span class="mj-agari-badge">${agariLabel}</span>` : ''}
      <img
        src="./tiles/${fileName}"
        class="mj-tile-img"
        alt=""
        loading="lazy"
        width="28"
        height="37"
        draggable="false"
        aria-hidden="true"
      />
    </span>
  `;
}

// 手牌全体のHTMLを生成
export function renderHand(handData) {
  if (!handData || !handData.groups) return '';
  const { groups, agari, agariLabel = '' } = handData;

  let handHtml = '<div class="mj-hand">';

  // 1. 手牌ブロック群
  handHtml += '<div class="mj-hand-groups">';
  groups.forEach((group) => {
    handHtml += '<div class="mj-hand-group">';
    group.forEach(code => {
      handHtml += renderTile(code);
    });
    handHtml += '</div>';
  });
  handHtml += '</div>';

  // 2. 一番右端固定の和了牌
  if (agari) {
    handHtml += `
      <div class="mj-hand-agari">
        ${renderTile(agari, { isAgari: true, agariLabel })}
      </div>
    `;
  }

  handHtml += '</div>';
  return handHtml;
}
