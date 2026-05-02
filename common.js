document.addEventListener("DOMContentLoaded", () => {
  if (location.pathname === "/" || location.pathname === "/index.html") return;
  if (location.pathname.startsWith("/fll2025")) return;

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