// ==UserScript==
// @name         4KHD Safe Browse
// @namespace    4khd-safe-browse
// @version      1.0.0
// @description  自動霧化 4khd.com 圖片，點擊查看，再次點擊重新遮蓋
// @match        *://*.4khd.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  // ─── 設定（預設值，透過 Tampermonkey 選單可調整）─────────────────────────
  const DEFAULTS = { enabled: true, blurStrength: 18, minImageSize: 100 };

  const settings = {
    enabled:      GM_getValue('enabled',      DEFAULTS.enabled),
    blurStrength: GM_getValue('blurStrength', DEFAULTS.blurStrength),
    minImageSize: GM_getValue('minImageSize', DEFAULTS.minImageSize),
  };

  // ─── CSS ────────────────────────────────────────────────────────────────
  GM_addStyle(`
    .nsfw-wrapper {
      position: relative !important;
      display: inline-block !important;
      overflow: hidden !important;
      line-height: 0 !important;
      isolation: isolate !important;
    }
    .nsfw-overlay {
      position: absolute !important;
      inset: 0 !important;
      width: 100% !important;
      height: 100% !important;
      --blur-px: 18px;
      backdrop-filter: blur(var(--blur-px)) saturate(70%) brightness(0.50) !important;
      -webkit-backdrop-filter: blur(var(--blur-px)) saturate(70%) brightness(0.50) !important;
      background-color: rgba(10, 10, 25, 0.30) !important;
      cursor: pointer !important;
      z-index: 9999 !important;
      border-radius: inherit !important;
      transition: opacity 0.3s ease !important;
    }
    .nsfw-overlay:hover {
      backdrop-filter: blur(var(--blur-px)) saturate(80%) brightness(0.60) !important;
      -webkit-backdrop-filter: blur(var(--blur-px)) saturate(80%) brightness(0.60) !important;
      background-color: rgba(10, 10, 25, 0.15) !important;
    }
    .nsfw-overlay--hiding {
      opacity: 0 !important;
      pointer-events: none !important;
    }
    .nsfw-label {
      position: absolute !important;
      bottom: 0 !important;
      left: 0 !important;
      right: 0 !important;
      padding: 16px 10px 10px !important;
      background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 100%) !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      gap: 3px !important;
      pointer-events: none !important;
      user-select: none !important;
    }
    .nsfw-icon {
      font-size: 22px !important;
      line-height: 1 !important;
      display: block !important;
      filter: drop-shadow(0 1px 3px rgba(0,0,0,0.8)) !important;
    }
    .nsfw-text {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Microsoft JhengHei', sans-serif !important;
      font-size: 11px !important;
      font-weight: 700 !important;
      color: #ff9090 !important;
      letter-spacing: 1px !important;
      text-transform: uppercase !important;
      display: block !important;
      line-height: 1.3 !important;
      text-shadow: 0 1px 4px rgba(0,0,0,0.9) !important;
    }
    .nsfw-hint {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Microsoft JhengHei', sans-serif !important;
      font-size: 10px !important;
      color: rgba(255, 255, 255, 0.60) !important;
      display: block !important;
      line-height: 1.3 !important;
      text-shadow: 0 1px 3px rgba(0,0,0,0.9) !important;
    }
    .nsfw-overlay:hover .nsfw-hint {
      color: rgba(255, 255, 255, 0.90) !important;
    }
    img.nsfw-revealed {
      cursor: pointer !important;
      outline: 2px solid rgba(220, 60, 60, 0.45) !important;
      outline-offset: -2px !important;
    }
    img.nsfw-revealed:hover {
      outline-color: rgba(220, 60, 60, 0.80) !important;
    }
  `);

  // ─── 追蹤集合 ────────────────────────────────────────────────────────────
  const processedImages = new WeakSet();
  const revealedImages  = new Set();

  // ─── 工具函式 ────────────────────────────────────────────────────────────
  function isContentImage(img) {
    const src = img.src || img.currentSrc || img.dataset.lazySrc || img.dataset.src || '';
    if (!src || src.startsWith('data:') || /\.svg(\?|$)/i.test(src)) return false;
    if (!/^https?:\/\//i.test(src)) return false;
    const w = img.offsetWidth  || img.naturalWidth  || 0;
    const h = img.offsetHeight || img.naturalHeight || 0;
    return (w >= settings.minImageSize || h >= settings.minImageSize);
  }

  function getImgSrc(img) {
    return img.src || img.currentSrc || img.dataset.src || '';
  }

  // ─── 套用霧化遮罩 ────────────────────────────────────────────────────────
  function applyBlur(img) {
    if (processedImages.has(img)) return;
    processedImages.add(img);

    const parent = img.parentElement;
    if (!parent) return;

    let wrapper;
    if (parent.classList.contains('nsfw-wrapper')) {
      wrapper = parent;
    } else {
      wrapper = document.createElement('div');
      wrapper.className = 'nsfw-wrapper';
      parent.insertBefore(wrapper, img);
      wrapper.appendChild(img);
    }

    const overlay = document.createElement('div');
    overlay.className = 'nsfw-overlay';
    overlay.dataset.imgSrc = getImgSrc(img);
    overlay.style.setProperty('--blur-px', settings.blurStrength + 'px');
    overlay.innerHTML = `
      <div class="nsfw-label">
        <span class="nsfw-icon">&#128274;</span>
        <span class="nsfw-text">敏感內容</span>
        <span class="nsfw-hint">點擊查看 &bull; 再次點擊重新遮蓋</span>
      </div>
    `;
    overlay.addEventListener('click', handleReveal, { once: true });
    wrapper.appendChild(overlay);
  }

  // ─── 點擊解鎖 ────────────────────────────────────────────────────────────
  function handleReveal(e) {
    e.preventDefault();
    e.stopPropagation();

    const overlay = e.currentTarget;
    const imgSrc  = overlay.dataset.imgSrc;

    overlay.classList.add('nsfw-overlay--hiding');
    setTimeout(() => {
      overlay.style.display = 'none';
      if (imgSrc) revealedImages.add(imgSrc);

      const wrapper = overlay.closest('.nsfw-wrapper');
      const img = wrapper?.querySelector('img');
      if (img) {
        img.classList.add('nsfw-revealed');
        img.addEventListener('click', handleReBlur, { once: true });
      }
    }, 300);
  }

  // ─── 點擊重新遮蓋 ────────────────────────────────────────────────────────
  function handleReBlur(e) {
    e.preventDefault();
    e.stopPropagation();

    const img     = e.currentTarget;
    const wrapper = img.closest('.nsfw-wrapper');
    if (!wrapper) return;

    const overlay = wrapper.querySelector('.nsfw-overlay');
    if (!overlay) return;

    img.classList.remove('nsfw-revealed');
    overlay.style.display = '';
    overlay.classList.remove('nsfw-overlay--hiding');
    overlay.style.setProperty('--blur-px', settings.blurStrength + 'px');
    overlay.addEventListener('click', handleReveal, { once: true });

    if (overlay.dataset.imgSrc) revealedImages.delete(overlay.dataset.imgSrc);
  }

  // ─── 主要圖片處理 ────────────────────────────────────────────────────────
  function processImage(img) {
    if (!settings.enabled) return;
    if (processedImages.has(img)) return;
    if (!isContentImage(img)) return;

    const src = getImgSrc(img);
    if (src && revealedImages.has(src)) {
      processedImages.add(img);
      return;
    }

    applyBlur(img);
  }

  function removeAllOverlays() {
    document.querySelectorAll('.nsfw-overlay').forEach((el) => el.remove());
    document.querySelectorAll('img.nsfw-revealed').forEach((img) => {
      img.classList.remove('nsfw-revealed');
    });
  }

  // ─── IntersectionObserver ────────────────────────────────────────────────
  const intersectionObs = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const img = entry.target;
      intersectionObs.unobserve(img);
      if (img.complete && img.naturalWidth > 0) {
        processImage(img);
      } else {
        img.addEventListener('load', () => processImage(img), { once: true });
      }
    });
  }, { rootMargin: '400px' });

  function observeAllImages() {
    document.querySelectorAll('img').forEach((img) => {
      if (!processedImages.has(img)) intersectionObs.observe(img);
    });
  }

  // ─── MutationObserver ────────────────────────────────────────────────────
  new MutationObserver((mutations) => {
    if (!settings.enabled) return;
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType !== Node.ELEMENT_NODE) return;
          const imgs = node.tagName === 'IMG'
            ? [node]
            : Array.from(node.querySelectorAll('img'));
          imgs.forEach((img) => intersectionObs.observe(img));
        });
      }
      if (mutation.type === 'attributes' && mutation.target.tagName === 'IMG') {
        const img = mutation.target;
        if (img.src && img.src.startsWith('http') && !processedImages.has(img)) {
          if (img.complete && img.naturalWidth > 0) {
            processImage(img);
          } else {
            img.addEventListener('load', () => processImage(img), { once: true });
          }
        }
      }
    });
  }).observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['src', 'data-lazy-src', 'data-src'],
  });

  // ─── Tampermonkey 選單 ───────────────────────────────────────────────────
  GM_registerMenuCommand(
    settings.enabled ? '✅ 停用霧化' : '⬛ 啟用霧化',
    () => {
      settings.enabled = !settings.enabled;
      GM_setValue('enabled', settings.enabled);
      if (settings.enabled) {
        observeAllImages();
      } else {
        removeAllOverlays();
      }
    }
  );

  const BLUR_STEPS = [6, 12, 18, 24, 32];
  GM_registerMenuCommand(
    `霧化強度：${settings.blurStrength}px（點擊切換）`,
    () => {
      const idx  = BLUR_STEPS.indexOf(settings.blurStrength);
      const next = BLUR_STEPS[(idx + 1) % BLUR_STEPS.length];
      settings.blurStrength = next;
      GM_setValue('blurStrength', next);
      document.querySelectorAll('.nsfw-overlay').forEach((el) => {
        el.style.setProperty('--blur-px', next + 'px');
      });
    }
  );

  // ─── 啟動 ────────────────────────────────────────────────────────────────
  if (settings.enabled) observeAllImages();
})();
