// 1) 数字入力 → 2倍表示
const input = document.getElementById("num");
const result = document.getElementById("result");
input.addEventListener("input", () => {
  const v = Number(input.value);
  result.textContent = Number.isFinite(v) ? `結果：${v * 2}` : "結果：—";
});

// 2) ボタン
const countBtn = document.getElementById("countBtn");
const countOut = document.getElementById("count");
let count = 0;
countBtn.addEventListener("click", () => {
  count++;
  countOut.textContent = String(count);
});

const toggleBtn = document.getElementById("toggleBtn");
const targetState = document.getElementById("targetState");
toggleBtn.addEventListener("click", () => {
  countBtn.disabled = !countBtn.disabled;
  targetState.textContent = countBtn.disabled ? "無効" : "有効";
});

// 3) 選択UI
const sel = document.getElementById("sel");
const selOut = document.getElementById("selOut");
sel.addEventListener("change", () => {
  selOut.textContent = sel.value || "—";
});

const themeOut = document.getElementById("themeOut");
document.querySelectorAll('input[name="theme"]').forEach(r => {
  r.addEventListener("change", () => {
    const val = document.querySelector('input[name="theme"]:checked')?.value ?? "—";
    themeOut.textContent = val;
    // ページ背景を軽く切替（おまけ）
    document.body.style.background = val === "ダーク" ? "#0f1115" : "";
    document.body.style.color = val === "ダーク" ? "#e7e9ee" : "";
  });
});

const agree = document.getElementById("agree");
const agreeOut = document.getElementById("agreeOut");
agree.addEventListener("change", () => {
  agreeOut.textContent = agree.checked ? "同意済み" : "未同意";
});

// 4) 入力いろいろ
const text = document.getElementById("text");
const len = document.getElementById("len");
text.addEventListener("input", () => {
  len.textContent = String(text.value.length);
});

const range = document.getElementById("range");
const rangeVal = document.getElementById("rangeVal");
range.addEventListener("input", () => {
  rangeVal.textContent = range.value;
});

const color = document.getElementById("color");
const colorBox = document.getElementById("colorBox");
colorBox.style.background = color.value;
color.addEventListener("input", () => {
  colorBox.style.background = color.value;
});

const date = document.getElementById("date");
const dateOut = document.getElementById("dateOut");
date.addEventListener("input", () => {
  dateOut.textContent = date.value || "—";
});

// 5) 画像プレビュー
const preview = document.getElementById("preview");
const imgUrl = document.getElementById("imgUrl");
const loadImgBtn = document.getElementById("loadImgBtn");
loadImgBtn.addEventListener("click", () => {
  const url = imgUrl.value.trim();
  if (!url) return;
  preview.src = url;
  preview.onerror = () => { preview.alt = "画像を読み込めませんでした。URLやCORSを確認してください。"; };
});

const imgFile = document.getElementById("imgFile");
imgFile.addEventListener("change", () => {
  const file = imgFile.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => { preview.src = e.target.result; preview.alt = "画像プレビュー"; };
  reader.readAsDataURL(file);
});

// 6) フォーム送信（送信抑止）
const demoForm = document.getElementById("demoForm");
const formMsg = document.getElementById("formMsg");
demoForm.addEventListener("submit", (e) => {
  e.preventDefault(); // ネットワーク送信を止める
  const data = new FormData(demoForm);
  formMsg.textContent = `送信OK: ${data.get("fName") ?? ""} / ${data.get("fEmail") ?? ""}`;
});
/* ===========================
   7) ドラッグ＆ドロップ
   =========================== */
// a) ファイルDnDで画像プレビュー
const dz = document.getElementById("dz");
const dropPreview = document.getElementById("dropPreview");

["dragenter","dragover"].forEach(ev=>{
  dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.add("hover"); });
});
["dragleave","drop"].forEach(ev=>{
  dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.remove("hover"); });
});
dz.addEventListener("drop", e => {
  const file = e.dataTransfer?.files?.[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) { alert("画像ファイルをドロップしてください"); return; }
  const reader = new FileReader();
  reader.onload = ev => { dropPreview.src = ev.target.result; dropPreview.alt = file.name; };
  reader.readAsDataURL(file);
});

// b) 要素のDnD（箱→ターゲット）
const dragItem = document.getElementById("dragItem");
const dropTarget = document.getElementById("dropTarget");
const dropCount = document.getElementById("dropCount");

dragItem.addEventListener("dragstart", e => {
  e.dataTransfer.setData("text/plain", "dragItem");
});
dropTarget.addEventListener("dragover", e => e.preventDefault());
dropTarget.addEventListener("drop", e => {
  e.preventDefault();
  const id = e.dataTransfer.getData("text/plain");
  if (id === "dragItem") {
    dropTarget.appendChild(dragItem);
    dropCount.textContent = String(Number(dropCount.textContent) + 1);
  }
});

/* ===========================
   8) キーボード入力
   =========================== */
const keyInfo = document.getElementById("keyInfo");
const board = document.getElementById("board");
const player = document.getElementById("player");

let px = 10, py = 10;                 // 位置（px）
const speed = 6;                       // 1回の移動量
const bounds = () => ({                // 移動範囲
  w: board.clientWidth, h: board.clientHeight,
  pw: player.clientWidth, ph: player.clientHeight
});
function renderPlayer(){
  player.style.transform = `translate(${px}px, ${py}px)`;
}
renderPlayer();

document.addEventListener("keydown", e => {
  // キー情報の表示
  keyInfo.textContent = `${e.ctrlKey ? "Ctrl+" : ""}${e.altKey ? "Alt+" : ""}${e.shiftKey ? "Shift+" : ""}${e.key}  (code: ${e.code})`;

  // フォーム入力中は移動処理をスキップ（入力を邪魔しない）
  const tag = document.activeElement?.tagName?.toLowerCase();
  const typing = tag === "input" || tag === "textarea" || document.activeElement?.isContentEditable;

  // ショートカット例：Ctrl+S を無効化してメッセージ
  if (e.ctrlKey && (e.key === "s" || e.key === "S")) {
    e.preventDefault();
    keyInfo.textContent = "保存ショートカット（Ctrl+S）は無効化しました。";
    return;
  }

  // 矢印/WASDでプレイヤー移動
  if (!typing) {
    const { w, h, pw, ph } = bounds();
    let dx = 0, dy = 0;
    if (e.key === "ArrowLeft"  || e.key === "a" || e.key === "A") dx = -speed;
    if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") dx =  speed;
    if (e.key === "ArrowUp"    || e.key === "w" || e.key === "W") dy = -speed;
    if (e.key === "ArrowDown"  || e.key === "s" || e.key === "S") dy =  speed;

    if (dx || dy) {
      e.preventDefault(); // ページスクロール抑止（矢印キー）
      px = Math.max(0, Math.min(px + dx, w - pw));
      py = Math.max(0, Math.min(py + dy, h - ph));
      renderPlayer();
    }
  }
});
