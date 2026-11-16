// 麻雀役一覧 アプリケーションロジック
import { YAKU_CATEGORIES, YAKU_TYPES, NAKI_TYPES, YAKU_LIST } from './yaku-data.js';
import { renderHand, renderTile } from './yaku-tiles.js';

// カタカナ・ひらがな正規化ヘルパー
function normalizeStr(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[\u30a1-\u30f6]/g, m => String.fromCharCode(m.charCodeAt(0) - 0x60)) // カタカナ→ひらがな
    .replace(/[\s\-_・]/g, '');
}

// 点数早見表のデータ
const SCORE_TABLE = {
  ko: [
    { fu: '20符', h1: '—', h2: '400/700 (ツモのみ)', h3: '700/1300', h4: '1300/2600' },
    { fu: '25符', h1: '—', h2: '1600 (七対子)', h3: '3200', h4: '6400' },
    { fu: '30符', h1: '1000 (300/500)', h2: '2000 (500/1000)', h3: '3900 (1000/2000)', h4: '7700 (2000/3900)' },
    { fu: '40符', h1: '1300 (400/700)', h2: '2600 (700/1300)', h3: '5200 (1300/2600)', h4: '8000 (満貫)' },
    { fu: '50符', h1: '1600 (400/800)', h2: '3200 (800/1600)', h3: '6400 (1600/3200)', h4: '8000 (満貫)' },
    { fu: '60符', h1: '2000 (500/1000)', h2: '3900 (1000/2000)', h3: '7700 (2000/3900)', h4: '8000 (満貫)' },
    { fu: '70符', h1: '2300 (600/1200)', h2: '4500 (1200/2300)', h3: '8000 (満貫)', h4: '8000 (満貫)' },
  ],
  oya: [
    { fu: '20符', h1: '—', h2: '700オール (ツモのみ)', h3: '1300オール', h4: '2600オール' },
    { fu: '25符', h1: '—', h2: '2400 (七対子)', h3: '4800', h4: '9600' },
    { fu: '30符', h1: '1500 (500オール)', h2: '2900 (1000オール)', h3: '5800 (2000オール)', h4: '11600 (3900オール)' },
    { fu: '40符', h1: '2000 (700オール)', h2: '3900 (1300オール)', h3: '7700 (2600オール)', h4: '12000 (満貫)' },
    { fu: '50符', h1: '2400 (800オール)', h2: '4800 (1600オール)', h3: '9600 (3200オール)', h4: '12000 (満貫)' },
    { fu: '60符', h1: '2900 (1000オール)', h2: '5800 (2000オール)', h3: '11600 (3900オール)', h4: '12000 (満貫)' },
    { fu: '70符', h1: '3400 (1200オール)', h2: '6800 (2300オール)', h3: '12000 (満貫)', h4: '12000 (満貫)' },
  ],
  highHands: [
    { name: '満貫（マンガン）', han: '5飜（または3飜70符/4飜40符以上）', ko: '8000点 (2000/4000)', oya: '12000点 (4000オール)' },
    { name: '跳満（ハネマン）', han: '6〜7飜', ko: '12000点 (3000/6000)', oya: '18000点 (6000オール)' },
    { name: '倍満（バイマン）', han: '8〜10飜', ko: '16000点 (4000/8000)', oya: '24000点 (8000オール)' },
    { name: '三倍満（サンバイマン）', han: '11〜12飜', ko: '24000点 (6000/12000)', oya: '36000点 (12000オール)' },
    { name: '数え役満 / 役満', han: '13飜以上 または 役満役', ko: '32000点 (8000/16000)', oya: '48000点 (16000オール)' },
    { name: 'ダブル役満', han: 'ダブル役満該当役', ko: '64000点 (16000/32000)', oya: '96000点 (32000オール)' },
  ],
};

let currentFilter = {
  query: '',
  category: 'all',
  naki: 'all',
  type: 'all',
};

// 役カードのHTML生成
function renderYakuCard(yaku) {
  const badgeClass = `yaku-badge-${yaku.category}`;
  const nakiClass = `naki-badge-${yaku.naki}`;

  return `
    <article class="yaku-card" id="yaku-${yaku.id}" data-id="${yaku.id}">
      <div class="yaku-card-header">
        <div class="yaku-title-block">
          <span class="yaku-kana">${yaku.kana}</span>
          <h3 class="yaku-name">${yaku.name}</h3>
        </div>
        <div class="yaku-badges">
          <span class="yaku-han-badge ${badgeClass}">${yaku.hanText}</span>
          <span class="yaku-naki-badge ${nakiClass}">${yaku.nakiText}</span>
        </div>
      </div>

      <div class="yaku-hand-container">
        ${renderHand(yaku.hand)}
      </div>

      <p class="yaku-summary">${yaku.summary}</p>

      <div class="yaku-details-collapse" id="detail-${yaku.id}">
        <div class="yaku-detail-inner">
          <p class="yaku-detail-text">${yaku.detail}</p>
          ${yaku.points && yaku.points.length > 0 ? `
            <div class="yaku-points-box">
              <span class="yaku-points-title">ポイント・注意点</span>
              <ul class="yaku-points-list">
                ${yaku.points.map(pt => `<li>${pt}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
        </div>
      </div>

      <div class="yaku-card-actions">
        <button class="yaku-toggle-btn" type="button" aria-expanded="false" data-target="detail-${yaku.id}">
          詳細
        </button>
      </div>
    </article>
  `;
}

// フィルター処理
function getFilteredYakuList() {
  const normQ = normalizeStr(currentFilter.query);

  return YAKU_LIST.filter(yaku => {
    // カテゴリフィルター
    if (currentFilter.category !== 'all' && yaku.category !== currentFilter.category) {
      return false;
    }

    // 鳴き条件フィルター
    if (currentFilter.naki !== 'all' && yaku.naki !== currentFilter.naki) {
      return false;
    }

    // タイプフィルター
    if (currentFilter.type !== 'all' && yaku.type !== currentFilter.type) {
      return false;
    }

    // 検索クエリ
    if (normQ) {
      const matchName = normalizeStr(yaku.name).includes(normQ);
      const matchKana = normalizeStr(yaku.kana).includes(normQ);
      const matchRomaji = normalizeStr(yaku.id).includes(normQ);
      const matchSumm = normalizeStr(yaku.summary).includes(normQ);
      const matchType = normalizeStr(yaku.typeName).includes(normQ);
      if (!matchName && !matchKana && !matchRomaji && !matchSumm && !matchType) {
        return false;
      }
    }

    return true;
  });
}

// 役一覧レンダリング
function updateYakuGrid() {
  const container = document.getElementById('yaku-grid-container');
  const countEl = document.getElementById('yaku-match-count');
  if (!container) return;

  const filtered = getFilteredYakuList();

  if (countEl) {
    countEl.textContent = `${filtered.length} 役`;
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="yaku-empty-state">
        <div class="yaku-empty-icon">🀄</div>
        <p class="yaku-empty-msg">条件に一致する役が見つかりませんでした。</p>
        <button id="yaku-reset-empty-btn" class="yaku-filter-btn" type="button">条件解除</button>
      </div>
    `;
    const resetEmptyBtn = document.getElementById('yaku-reset-empty-btn');
    if (resetEmptyBtn) {
      resetEmptyBtn.addEventListener('click', resetFilters);
    }
    return;
  }

  container.innerHTML = filtered.map(renderYakuCard).join('');

  // 詳細アコーディオントグルイベント
  container.querySelectorAll('.yaku-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      const detailEl = document.getElementById(targetId);
      if (!detailEl) return;

      const isExpanded = detailEl.classList.toggle('expanded');
      btn.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
      btn.textContent = isExpanded ? '簡易表示' : '詳細';
    });
  });
}

// フィルターリセット
function resetFilters() {
  currentFilter = {
    query: '',
    category: 'all',
    naki: 'all',
    type: 'all',
  };

  const searchInput = document.getElementById('yaku-search-input');
  if (searchInput) searchInput.value = '';

  document.querySelectorAll('#yaku-category-chips .yaku-chip').forEach(c => {
    c.classList.toggle('active', c.dataset.cat === 'all');
  });

  const nakiSelect = document.getElementById('yaku-naki-select');
  if (nakiSelect) nakiSelect.value = 'all';

  const typeSelect = document.getElementById('yaku-type-select');
  if (typeSelect) typeSelect.value = 'all';

  updateYakuGrid();
}

// 点数表のHTML生成
function renderScoreTable() {
  const koRows = SCORE_TABLE.ko.map(row => `
    <tr>
      <td class="st-fu">${row.fu}</td>
      <td>${row.h1}</td>
      <td>${row.h2}</td>
      <td>${row.h3}</td>
      <td>${row.h4}</td>
    </tr>
  `).join('');

  const oyaRows = SCORE_TABLE.oya.map(row => `
    <tr>
      <td class="st-fu">${row.fu}</td>
      <td>${row.h1}</td>
      <td>${row.h2}</td>
      <td>${row.h3}</td>
      <td>${row.h4}</td>
    </tr>
  `).join('');

  const highRows = SCORE_TABLE.highHands.map(h => `
    <tr>
      <td class="st-rank">${h.name}</td>
      <td class="st-han">${h.han}</td>
      <td class="st-score">${h.ko}</td>
      <td class="st-score">${h.oya}</td>
    </tr>
  `).join('');

  return `
    <div class="score-quick-panel" id="score-quick-panel">
      <div class="score-panel-header">
        <h3 class="score-panel-title">点数早見表</h3>
        <button id="score-panel-close-btn" class="score-panel-close-btn" type="button" aria-label="非表示">非表示</button>
      </div>

      <div class="score-subtabs">
        <button class="score-subtab-btn active" data-st-tab="st-ko" type="button">子（ツモ/ロン）</button>
        <button class="score-subtab-btn" data-st-tab="st-oya" type="button">親（ツモ/ロン）</button>
        <button class="score-subtab-btn" data-st-tab="st-high" type="button">満貫以上</button>
        <button class="score-subtab-btn" data-st-tab="st-fu" type="button">符計算メモ</button>
      </div>

      <!-- 子の表 -->
      <div id="st-ko" class="score-tab-content active">
        <p class="score-sub-note">ロン時の支払点（カッコ内はツモ時：子の支払 / 親の支払）</p>
        <div class="score-table-wrap">
          <table class="st-table">
            <thead>
              <tr><th>符＼飜</th><th>1飜</th><th>2飜</th><th>3飜</th><th>4飜</th></tr>
            </thead>
            <tbody>${koRows}</tbody>
          </table>
        </div>
      </div>

      <!-- 親の表 -->
      <div id="st-oya" class="score-tab-content">
        <p class="score-sub-note">ロン時の支払点（カッコ内はツモ時：子1人の支払オール）</p>
        <div class="score-table-wrap">
          <table class="st-table">
            <thead>
              <tr><th>符＼飜</th><th>1飜</th><th>2飜</th><th>3飜</th><th>4飜</th></tr>
            </thead>
            <tbody>${oyaRows}</tbody>
          </table>
        </div>
      </div>

      <!-- 満貫以上 -->
      <div id="st-high" class="score-tab-content">
        <div class="score-table-wrap">
          <table class="st-table st-table-high">
            <thead>
              <tr><th>役クラス</th><th>飜数目安</th><th>子の点数</th><th>親の点数</th></tr>
            </thead>
            <tbody>${highRows}</tbody>
          </table>
        </div>
      </div>

      <!-- 符計算の基本 -->
      <div id="st-fu" class="score-tab-content">
        <div class="fu-guide-content">
          <ul class="fu-guide-list">
            <li><strong>基本符</strong>: 副底（フーテイ）20符固定。</li>
            <li><strong>平和ツモ</strong>: 20符2飜（子1500点/親2900点）。ツモ符はつきません。</li>
            <li><strong>七対子</strong>: 25符固定（ツモでもロンでも25符2飜）。</li>
            <li><strong>門前ロン</strong>: 符底20符 ＋ 門前加符10符 ＝ 最低30符（実質40符〜）。</li>
            <li><strong>ツモ符</strong>: ＋2符（平和ツモ・七対子を除く）。</li>
            <li><strong>単騎・カンチャン・ペンチャン待ち</strong>: ＋2符。</li>
            <li><strong>役牌の雀頭</strong>: ＋2符（ダブ東・ダブ南はルールにより2符または4符）。</li>
            <li><strong>1の位の端数切り上げ</strong>: 合計符数の1の位は切り上げて10符単位にします（例: 32符 → 40符）。</li>
          </ul>
        </div>
      </div>
    </div>
  `;
}

// 役一覧タブの初期化
export function initYakuTab() {
  const root = document.getElementById('t-yaku');
  if (!root) return;

  // 基本DOM構造の生成
  root.innerHTML = `
    <div class="yaku-app-shell">
      <!-- 上部検索 & クイックバー -->
      <div class="yaku-toolbar">
        <div class="yaku-search-box">
          <span class="yaku-search-icon" aria-hidden="true">🔍</span>
          <input
            id="yaku-search-input"
            class="yaku-search-input"
            type="search"
            placeholder="役名・読み・キーワード（例: タンヤオ、ちーとい、ピンフ）"
            autocomplete="off"
          />
          <button id="yaku-search-clear" class="yaku-search-clear" type="button" aria-label="検索クリア" style="display:none">×</button>
        </div>
        <button id="yaku-toggle-score-btn" class="yaku-score-toggle-btn" type="button">
          点数早見表
        </button>
      </div>

      <!-- 点数早見表エリア -->
      <div id="score-table-container" style="display:none">
        ${renderScoreTable()}
      </div>

      <!-- 飜数カテゴリーチップ -->
      <div class="yaku-chips-container" id="yaku-category-chips">
        ${YAKU_CATEGORIES.map(cat => `
          <button
            class="yaku-chip${cat.id === 'all' ? ' active' : ''}"
            type="button"
            data-cat="${cat.id}"
          >
            ${cat.label}
          </button>
        `).join('')}
      </div>

      <!-- サブフィルターバー -->
      <div class="yaku-filter-subbar">
        <div class="yaku-filter-group">
          <label for="yaku-naki-select">鳴き条件</label>
          <select id="yaku-naki-select" class="yaku-select">
            ${NAKI_TYPES.map(n => `<option value="${n.id}">${n.label}</option>`).join('')}
          </select>
        </div>

        <div class="yaku-filter-group">
          <label for="yaku-type-select">手役系統</label>
          <select id="yaku-type-select" class="yaku-select">
            ${YAKU_TYPES.map(t => `<option value="${t.id}">${t.label}</option>`).join('')}
          </select>
        </div>

        <div class="yaku-filter-summary">
          <span id="yaku-match-count" class="yaku-count-badge">全役</span>
          <button id="yaku-reset-filters-btn" class="yaku-filter-reset-link" type="button">リセット</button>
        </div>
      </div>

      <!-- 役カードグリッド -->
      <div id="yaku-grid-container" class="yaku-grid"></div>
    </div>
  `;

  // イベント設定
  const searchInput = document.getElementById('yaku-search-input');
  const searchClear = document.getElementById('yaku-search-clear');
  const nakiSelect = document.getElementById('yaku-naki-select');
  const typeSelect = document.getElementById('yaku-type-select');
  const resetBtn = document.getElementById('yaku-reset-filters-btn');
  const scoreToggleBtn = document.getElementById('yaku-toggle-score-btn');
  const scoreContainer = document.getElementById('score-table-container');

  // 検索入力
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      currentFilter.query = searchInput.value.trim();
      if (searchClear) {
        searchClear.style.display = currentFilter.query ? 'inline-flex' : 'none';
      }
      updateYakuGrid();
    });
  }

  // 検索クリア
  if (searchClear) {
    searchClear.addEventListener('click', () => {
      searchInput.value = '';
      currentFilter.query = '';
      searchClear.style.display = 'none';
      searchInput.focus();
      updateYakuGrid();
    });
  }

  // 飜数チップ
  document.querySelectorAll('#yaku-category-chips .yaku-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#yaku-category-chips .yaku-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentFilter.category = chip.dataset.cat;
      updateYakuGrid();
    });
  });

  // 鳴きセレクト
  if (nakiSelect) {
    nakiSelect.addEventListener('change', () => {
      currentFilter.naki = nakiSelect.value;
      updateYakuGrid();
    });
  }

  // 系統セレクト
  if (typeSelect) {
    typeSelect.addEventListener('change', () => {
      currentFilter.type = typeSelect.value;
      updateYakuGrid();
    });
  }

  // リセットボタン
  if (resetBtn) {
    resetBtn.addEventListener('click', resetFilters);
  }

  // 点数表トグル
  if (scoreToggleBtn && scoreContainer) {
    scoreToggleBtn.addEventListener('click', () => {
      const isVisible = scoreContainer.style.display !== 'none';
      scoreContainer.style.display = isVisible ? 'none' : 'block';
      scoreToggleBtn.classList.toggle('active', !isVisible);
    });

    const scoreCloseBtn = document.getElementById('score-panel-close-btn');
    if (scoreCloseBtn) {
      scoreCloseBtn.addEventListener('click', () => {
        scoreContainer.style.display = 'none';
        scoreToggleBtn.classList.remove('active');
      });
    }

    // 点数表サブタブ切り替え
    scoreContainer.querySelectorAll('.score-subtab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        scoreContainer.querySelectorAll('.score-subtab-btn').forEach(b => b.classList.remove('active'));
        scoreContainer.querySelectorAll('.score-tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        const target = document.getElementById(btn.dataset.stTab);
        if (target) target.classList.add('active');
      });
    });
  }

  // 初回レンダリング
  updateYakuGrid();

  // URLハッシュによる役ジャンプの検知
  if (location.hash && location.hash.startsWith('#yaku-')) {
    setTimeout(() => {
      const el = document.getElementById(location.hash.slice(1));
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('yaku-highlight');
        setTimeout(() => el.classList.remove('yaku-highlight'), 2000);
      }
    }, 200);
  }
}
