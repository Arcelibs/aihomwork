(() => {
  'use strict';

  const BUTTON_ID = 'easyvideodl-btn';
  const DEFAULT_SERVER_URL = 'http://localhost:6789';

  const site = {
    isVideoPage: () => location.pathname.startsWith('/watch'),
    selectors: [
      'ytd-watch-metadata #actions #top-level-buttons-computed',
      '#top-level-buttons-computed',
      '#actions.ytd-watch-metadata',
      '#actions',
    ],
    listenNavigate: (cb) => {
      document.addEventListener('yt-navigate-finish', () => setTimeout(cb, 1500));
    },
  };

  const STATE = {
    IDLE: 'idle',
    CHECKING: 'checking',
    DOWNLOADING: 'downloading',
    DONE: 'done',
    ERROR: 'error',
    OFFLINE: 'server-offline',
  };

  const STATE_CONFIG = {
    [STATE.IDLE]:        { text: '⬇ 下載',         disabled: false },
    [STATE.CHECKING]:    { text: '確認中...',        disabled: true  },
    [STATE.DOWNLOADING]: { text: '下載中...',        disabled: true  },
    [STATE.DONE]:        { text: '✅ 完成！',        disabled: true  },
    [STATE.ERROR]:       { text: '❌ 失敗',          disabled: false },
    [STATE.OFFLINE]:     { text: '🔌 伺服器未啟動', disabled: false },
  };

  let retryTimer = null;

  async function getSettings() {
    try {
      const result = await chrome.storage.sync.get(['format', 'serverUrl']);
      return {
        format: result.format || 'best',
        serverUrl: (result.serverUrl || DEFAULT_SERVER_URL).replace(/\/$/, ''),
      };
    } catch {
      return { format: 'best', serverUrl: DEFAULT_SERVER_URL };
    }
  }

  function createButton() {
    const btn = document.createElement('button');
    btn.id = BUTTON_ID;
    btn.className = 'easyvideodl-btn';
    applyState(btn, STATE.IDLE);
    btn.addEventListener('click', handleClick);
    return btn;
  }

  function applyState(btn, state) {
    btn.dataset.state = state;
    const cfg = STATE_CONFIG[state];
    btn.textContent = cfg.text;
    btn.disabled = cfg.disabled;
  }

  // 透過 background service worker 代理 HTTP 請求，
  // 避免從 HTTPS 的 YouTube 頁面直接發 HTTP 造成 Mixed Content 錯誤
  function sendToBackground(message) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, (response) => {
        resolve(response || {});
      });
    });
  }

  async function handleClick() {
    const btn = document.getElementById(BUTTON_ID);
    if (!btn || btn.disabled) return;

    applyState(btn, STATE.CHECKING);

    const { format, serverUrl } = await getSettings();

    // Step 1：確認伺服器狀態
    const statusResult = await sendToBackground({ type: 'CHECK_SERVER', serverUrl });
    if (!statusResult.ok) {
      applyState(btn, STATE.OFFLINE);
      setTimeout(() => applyState(btn, STATE.IDLE), 5000);
      return;
    }

    applyState(btn, STATE.DOWNLOADING);

    // Step 2：發送下載請求
    const dlResult = await sendToBackground({
      type: 'DOWNLOAD',
      serverUrl,
      url: window.location.href,
      format,
      title: document.title.replace(' - YouTube', '').trim(),
    });

    if (dlResult.status === 202) {
      applyState(btn, STATE.DONE);
      setTimeout(() => applyState(btn, STATE.IDLE), 5000);
    } else {
      console.error('[EasyVideoDL] 下載失敗，status:', dlResult.status);
      applyState(btn, STATE.ERROR);
      setTimeout(() => applyState(btn, STATE.IDLE), 5000);
    }
  }

  function getTargetContainer() {
    for (const sel of site.selectors) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    return null;
  }

  function tryInjectButton(attempt = 0) {
    if (!site.isVideoPage()) return;
    if (document.getElementById(BUTTON_ID)) return;

    const container = getTargetContainer();
    if (container) {
      container.prepend(createButton());
      return;
    }

    if (attempt < 10) {
      retryTimer = setTimeout(() => tryInjectButton(attempt + 1), 500);
    } else {
      console.warn('[EasyVideoDL] 無法找到注入目標，已放棄');
    }
  }

  function removeButton() {
    document.getElementById(BUTTON_ID)?.remove();
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
  }

  function init() {
    tryInjectButton();
    site.listenNavigate(() => {
      removeButton();
      tryInjectButton();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
