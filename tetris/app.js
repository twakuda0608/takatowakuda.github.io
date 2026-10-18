/**
 * テトリスカリキュラム インタラクティブUIスクリプト
 * app.js
 */

document.addEventListener("DOMContentLoaded", () => {
  // 1. コードコピー機能
  initCodeCopy();

  // 2. 目次（TOC）モバイル開閉 & スムーズスクロール
  initToc();

  // 3. スクロールスパイ（現在レッスンの目次ハイライト）
  initScrollSpy();

  // 4. スクロールトップボタン
  initScrollTop();

  // 5. ★印コメントの自動ハイライト
  initCommentHighlight();
});

/**
 * コードブロックのコピー機能
 */
function initCodeCopy() {
  const copyButtons = document.querySelectorAll(".copy-btn");

  copyButtons.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const container = btn.closest(".code-container");
      if (!container) return;

      const codeEl = container.querySelector("code");
      if (!codeEl) return;

      const text = codeEl.innerText;

      try {
        await navigator.clipboard.writeText(text);
        
        // ボタン文言を体言止めで切り替え
        const btnText = btn.querySelector(".btn-text");
        const originalText = btnText ? btnText.textContent : "コピー";
        
        if (btnText) btnText.textContent = "コピー完了";
        btn.classList.add("copied");

        setTimeout(() => {
          if (btnText) btnText.textContent = originalText;
          btn.classList.remove("copied");
        }, 2000);
      } catch (err) {
        console.error("クリップボードへのコピーに失敗しました:", err);
      }
    });
  });
}

/**
 * 目次の開閉（モバイル対応）とスムーズスクロール
 */
function initToc() {
  const toggleBtn = document.getElementById("toc-toggle-btn");
  const closeBtn = document.getElementById("toc-close-btn");
  const sidebar = document.getElementById("sidebar-aside");
  const backdrop = document.getElementById("toc-backdrop");
  const tocLinks = document.querySelectorAll(".toc-link");

  function openToc() {
    sidebar.classList.add("open");
    backdrop.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function closeToc() {
    sidebar.classList.remove("open");
    backdrop.classList.remove("open");
    document.body.style.overflow = "";
  }

  if (toggleBtn) toggleBtn.addEventListener("click", openToc);
  if (closeBtn) closeBtn.addEventListener("click", closeToc);
  if (backdrop) backdrop.addEventListener("click", closeToc);

  // リンククリック時のスムーズスクロール & ドロワー閉じ
  tocLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      const targetId = link.getAttribute("href");
      if (targetId && targetId.startsWith("#")) {
        const targetEl = document.querySelector(targetId);
        if (targetEl) {
          e.preventDefault();
          closeToc();
          targetEl.scrollIntoView({ behavior: "smooth" });
          history.pushState(null, "", targetId);
        }
      }
    });
  });
}

/**
 * スクロール位置に応じた目次アクティブ表示（ScrollSpy）
 */
function initScrollSpy() {
  const sections = document.querySelectorAll(".lesson-section");
  const tocLinks = document.querySelectorAll(".toc-link");

  if (!sections.length || !tocLinks.length) return;

  const linkMap = new Map();
  tocLinks.forEach((link) => {
    const target = link.getAttribute("data-target");
    if (target) linkMap.set(target, link);
  });

  const observerOptions = {
    root: null,
    rootMargin: "-80px 0px -60% 0px",
    threshold: 0
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        tocLinks.forEach((l) => l.classList.remove("active"));
        const activeLink = linkMap.get(id);
        if (activeLink) {
          activeLink.classList.add("active");
          // サイドバー内でアクティブ項目が見えるようにスクロール
          activeLink.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }
      }
    });
  }, observerOptions);

  sections.forEach((sec) => observer.observe(sec));
}

/**
 * 画像拡大ライトボックスモーダル


/**
 * スクロールトップボタン
 */
function initScrollTop() {
  const scrollBtn = document.getElementById("scroll-top-btn");
  if (!scrollBtn) return;

  window.addEventListener("scroll", () => {
    if (window.scrollY > 400) {
      scrollBtn.classList.add("visible");
    } else {
      scrollBtn.classList.remove("visible");
    }
  }, { passive: true });

  scrollBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

/**
 * ★マーク付きの追加・変更コメントをハイライト
 */
function initCommentHighlight() {
  function applyHighlight() {
    document.querySelectorAll(".token.comment").forEach((el) => {
      if (el.textContent.includes("★")) {
        el.classList.add("highlight-comment");
      }
    });
  }

  if (window.Prism && window.Prism.hooks) {
    window.Prism.hooks.add("complete", () => {
      applyHighlight();
    });
  }
  applyHighlight();
  setTimeout(applyHighlight, 200);
  setTimeout(applyHighlight, 800);
}

