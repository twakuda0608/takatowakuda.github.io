document.addEventListener("DOMContentLoaded", () => {
  if (location.pathname === "/" || location.pathname === "/index.html") return;
  if (location.pathname.startsWith("/fll2025")) return;

  const btn = document.createElement("a");
  btn.href = "/";
  btn.className = "back-fab";
  btn.setAttribute("aria-label", "ホームに戻る");
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

  document.body.appendChild(btn);
});