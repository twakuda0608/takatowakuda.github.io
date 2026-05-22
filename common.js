function makeAutocomplete(input, getNames) {
  let panel = null, activeIdx = -1;

  function close() { panel?.remove(); panel = null; activeIdx = -1; }

  function pick(name) {
    input.value = name;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    close();
  }

  function open() {
    close();
    const q = input.value.trim().toLowerCase();
    const names = getNames();
    const list = q ? names.filter(n => n.toLowerCase().startsWith(q)) : names;
    if (!list.length) return;
    const rect = input.getBoundingClientRect();
    panel = document.createElement('div');
    panel.className = 'ac-list';
    panel.style.cssText = `position:fixed;top:${rect.bottom + 2}px;left:${rect.left}px;width:${rect.width}px`;
    list.forEach(name => {
      const item = document.createElement('div');
      item.className = 'ac-item';
      item.textContent = name;
      item.addEventListener('pointerdown', e => e.preventDefault());
      item.addEventListener('click', () => pick(name));
      panel.appendChild(item);
    });
    document.body.appendChild(panel);
  }

  input.addEventListener('focus', open);
  input.addEventListener('input', open);
  input.addEventListener('blur', () => setTimeout(close, 100));
  input.addEventListener('keydown', e => {
    if (!panel) return;
    const items = panel.querySelectorAll('.ac-item');
    if (!items.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); activeIdx = Math.min(activeIdx + 1, items.length - 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); activeIdx = Math.max(activeIdx - 1, 0); }
    else if (e.key === 'Enter' && activeIdx >= 0) { e.preventDefault(); pick(items[activeIdx].textContent); return; }
    else if (e.key === 'Escape') { close(); return; }
    else return;
    items.forEach((el, i) => el.classList.toggle('ac-active', i === activeIdx));
    items[activeIdx]?.scrollIntoView({ block: 'nearest' });
  });

  return { close, open };
}

document.addEventListener("DOMContentLoaded", () => {
  if (location.pathname === "/" || location.pathname === "/index.html") return;
  if (location.pathname.startsWith("/fll2025")) return;
  if (location.pathname.startsWith("/mahjong-table")) return;
  if (document.querySelector('.back-fab')) return;

  const btn = document.createElement("button");
  btn.className = "back-fab";
  btn.setAttribute("aria-label", "前のページに戻る");
  btn.innerHTML = `
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path d="M15 18l-6-6 6-6"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"/>
    </svg>
  `;
  btn.addEventListener("click", () => {
    const parts = location.pathname.replace(/\/$/, "").split("/");
    parts.pop();
    location.href = parts.join("/") + "/" || "/";
  });

  document.body.appendChild(btn);
});