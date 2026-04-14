document.addEventListener("DOMContentLoaded", () => {
  const el = (id) => document.getElementById(id);

  const amountEl = el("amount");
  const fromHidden = el("from");
  const toHidden = el("to");
  const fromLabel = el("fromLabel");
  const toLabel = el("toLabel");

  const swapBtn = el("swap");
  const refreshBtn = el("refresh");
  const autoEl = el("auto");

  const metaEl = el("meta");
  const errEl = el("err");
  const tbody = el("tbody");

  const toClearBtn = el("toClear");
  const toDoneBtn = el("toDone");
  const toCountEl = el("toCount");

  // 通貨一覧：必要なら増やしてOK
  const CURRENCIES = [
    { code:"JPY", name:"日本円" },
    { code:"USD", name:"米ドル" },
    { code:"EUR", name:"ユーロ" },
    { code:"GBP", name:"英ポンド" },
    { code:"AUD", name:"豪ドル" },
    { code:"CAD", name:"カナダドル" },
    { code:"CHF", name:"スイスフラン" },
    { code:"CNY", name:"人民元" },
    { code:"HKD", name:"香港ドル" },
    { code:"SGD", name:"シンガポールドル" },
    { code:"SEK", name:"スウェーデンクローナ" },
    { code:"NOK", name:"ノルウェークローネ" },
    { code:"DKK", name:"デンマーククローネ" },
    { code:"NZD", name:"NZドル" }
  ];

  const fmt = (n, maxFrac=6) =>
    new Intl.NumberFormat("ja-JP", { maximumFractionDigits: maxFrac }).format(n);

  function getToArray() {
    try {
      const a = JSON.parse(toHidden.value || "[]");
      return Array.isArray(a) ? a : [];
    } catch {
      return [];
    }
  }
  function setToArray(arr) {
    const uniq = Array.from(new Set(arr)).filter(x => typeof x === "string" && x.length === 3);
    toHidden.value = JSON.stringify(uniq);
  }

  function setFrom(code) {
    fromHidden.value = code;
    const cur = CURRENCIES.find(c => c.code === code);
    fromLabel.textContent = cur ? `${cur.code} - ${cur.name}` : code;
  }

  function refreshToLabel() {
    const arr = getToArray();
    const head = arr.slice(0, 3).join(", ");
    const suffix = arr.length > 3 ? `, ...（${arr.length}件）` : `（${arr.length}件）`;
    toLabel.textContent = (arr.length ? head + suffix : "未選択（0件）");
    toCountEl.textContent = `選択: ${arr.length}`;
  }

  // ===== ドロップダウン（単一選択 / 複数選択） =====
  function initDropdown(dd) {
    const kind = dd.dataset.kind; // single | multi
    const toggle = dd.querySelector(".dd-toggle");
    const menu = dd.querySelector(".dd-menu");
    const search = dd.querySelector(".dd-search");
    const list = dd.querySelector(".dd-list");
    const target = dd.dataset.target;

    function open() {
      dd.classList.add("open");
      render(search.value);
      search.focus();
      search.select();
    }
    function close() {
      dd.classList.remove("open");
    }
    function render(filter) {
      const kw = (filter || "").trim().toLowerCase();
      list.innerHTML = "";

      const filtered = CURRENCIES.filter(c => {
        if (!kw) return true;
        return c.code.toLowerCase().includes(kw) || c.name.toLowerCase().includes(kw);
      });

      if (!filtered.length) {
        const li = document.createElement("li");
        li.className = "dd-item is-empty";
        li.textContent = "該当なし";
        list.appendChild(li);
        return;
      }

      if (kind === "single") {
        filtered.forEach(c => {
          const li = document.createElement("li");
          li.className = "dd-item";
          li.dataset.code = c.code;
          li.textContent = `${c.code} - ${c.name}`;
          list.appendChild(li);
        });
      } else {
        const selected = new Set(getToArray());
        filtered.forEach(c => {
          const li = document.createElement("li");
          li.className = "dd-item";
          li.dataset.code = c.code;

          const wrap = document.createElement("div");
          wrap.className = "dd-item-check";

          const cb = document.createElement("input");
          cb.type = "checkbox";
          cb.checked = selected.has(c.code);
          cb.addEventListener("click", (e) => e.stopPropagation());

          const sp = document.createElement("span");
          sp.textContent = `${c.code} - ${c.name}`;

          wrap.appendChild(cb);
          wrap.appendChild(sp);
          li.appendChild(wrap);
          list.appendChild(li);
        });
      }
    }

    toggle.addEventListener("click", () => {
      dd.classList.contains("open") ? close() : open();
    });

    search.addEventListener("input", () => render(search.value));

    list.addEventListener("click", (e) => {
      const item = e.target.closest(".dd-item");
      const code = item?.dataset?.code;
      if (!code) return;

      if (kind === "single") {
        setFrom(code);
        close();
        if (autoEl.checked) convert();
      } else {
        const cb = item.querySelector('input[type="checkbox"]');
        if (!cb) return;
        cb.checked = !cb.checked;

        const arr = getToArray();
        const set = new Set(arr);
        if (cb.checked) set.add(code);
        else set.delete(code);

        setToArray(Array.from(set));
        refreshToLabel();
        if (autoEl.checked) convert();
      }
    });

    document.addEventListener("click", (e) => {
      if (!dd.contains(e.target)) close();
    });

    render("");
  }

  document.querySelectorAll(".dd").forEach(initDropdown);

  // To footer buttons
  toClearBtn.addEventListener("click", () => {
    setToArray([]);
    refreshToLabel();
    document
      .querySelectorAll('.dd[data-target="to"] .dd-list input[type="checkbox"]')
      .forEach(cb => {
        cb.checked = false;
      });

    if (autoEl.checked) convert();
  });
  toDoneBtn.addEventListener("click", () => {
    document.querySelector('.dd[data-target="to"]')?.classList.remove("open");
  });

  // 初期値ラベル反映
  setFrom(fromHidden.value || "JPY");
  refreshToLabel();

  // ===== 換算（複数通貨） =====
  let cache = { key:null, ts:0, data:null };
  const CACHE_MS = 60_000;

  async function convert() {
    errEl.textContent = "";
    metaEl.textContent = "";

    const a = Number(amountEl.value);
    const base = (fromHidden.value || "").toUpperCase();
    const symbolsArr = getToArray().map(x => x.toUpperCase()).filter(x => x && x.length === 3);

    if (!isFinite(a) || a < 0) {
      errEl.textContent = "金額が不正です．";
      return;
    }
    if (!base || base.length !== 3) {
      errEl.textContent = "From が不正です（例：JPY）．";
      return;
    }
    if (!symbolsArr.length) {
      tbody.innerHTML = `<tr><td colspan="3" class="muted">To が未選択です．</td></tr>`;
      return;
    }

    const symbols = symbolsArr.filter(s => s !== base);
    if (!symbols.length) {
      tbody.innerHTML = `<tr><td colspan="3" class="muted">To が From と同じ通貨です．</td></tr>`;
      return;
    }

    const key = `${a}|${base}|${symbols.join(",")}`;
    const now = Date.now();
    if (cache.key === key && (now - cache.ts) < CACHE_MS && cache.data) {
      render(cache.data, a, base, symbols, true);
      return;
    }

    const url = new URL("https://api.frankfurter.dev/v1/latest");
    url.searchParams.set("base", base);
    url.searchParams.set("symbols", symbols.join(","));

    try {
      const res = await fetch(url.toString(), { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      cache = { key, ts: now, data };
      render(data, a, base, symbols, false);
    } catch (e) {
      errEl.textContent = `レート取得に失敗しました．（${String(e.message || e)}）`;
    }
  }

  function render(data, amount, base, symbols, fromCache) {
    const date = data?.date || "—";
    const rates = data?.rates || {};

    const rows = [];

    rows.push({
      sym: base + "（基準）",
      converted: amount,
      r: 1
    });

    for (const sym of symbols) {
      const r = rates[sym];
      if (typeof r !== "number") continue;
      rows.push({
        sym,
        converted: amount * r,
        r
      });
    }

    if (rows.length === 1) {
      tbody.innerHTML =
        `<tr><td colspan="3" class="muted">レートが取得できませんでした．</td></tr>`;
      return;
    }

    const baseRow = rows.shift();
    rows.sort((a, b) => b.converted - a.converted);
    rows.unshift(baseRow);

    tbody.innerHTML = rows.map(x => `
      <tr>
        <td>${x.sym}</td>
        <td class="num">${fmt(x.converted, 6)}</td>
        <td class="num">${fmt(x.r, 8)}</td>
      </tr>
    `).join("");

    metaEl.textContent =
      `基準: ${fmt(amount, 6)} ${base} ／ date: ${date}` +
      (fromCache ? "（キャッシュ）" : "");
  }

  function maybeAuto() { if (autoEl.checked) convert(); }

  amountEl.addEventListener("input", maybeAuto);
  amountEl.addEventListener("change", maybeAuto);
  refreshBtn.addEventListener("click", convert);

  swapBtn.addEventListener("click", () => {
    const arr = getToArray();
    if (!arr.length) return;

    const newFrom = arr[0];
    const oldFrom = fromHidden.value;

    setFrom(newFrom);

    const rest = arr.slice(1);
    if (oldFrom && oldFrom.length === 3 && oldFrom !== newFrom) rest.unshift(oldFrom);

    setToArray(rest);
    refreshToLabel();
    maybeAuto();
  });

  convert();
  window.convert = convert;
});
