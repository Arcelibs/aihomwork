const DEFAULT_SETTINGS = {
  format: 'mp4',
  serverUrl: 'http://localhost:6789',
};

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(Object.keys(DEFAULT_SETTINGS), (stored) => {
    const toSet = {};
    for (const [key, val] of Object.entries(DEFAULT_SETTINGS)) {
      if (stored[key] === undefined) toSet[key] = val;
    }
    if (Object.keys(toSet).length > 0) chrome.storage.sync.set(toSet);
  });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const serverUrl = (message.serverUrl || DEFAULT_SETTINGS.serverUrl).replace(/\/$/, '');

  if (message.type === 'CHECK_SERVER') {
    fetch(`${serverUrl}/status`, { signal: AbortSignal.timeout(3000) })
      .then((res) => sendResponse({ ok: res.ok }))
      .catch(() => sendResponse({ ok: false }));
    return true;
  }

  if (message.type === 'DOWNLOAD') {
    fetch(`${serverUrl}/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: message.url, format: message.format }),
      signal: AbortSignal.timeout(10000),
    })
      .then(async (res) => {
        if (res.status === 202) {
          const data = await res.json();
          // 將任務資訊儲存至 local storage，供 popup 顯示
          const { tasks = [] } = await chrome.storage.local.get(['tasks']);
          tasks.unshift({
            task_id: data.task_id,
            title: message.title || message.url,
            format: message.format,
            serverUrl,
            status: 'queued',
            progress: null,
            speed: null,
            timestamp: Date.now(),
          });
          await chrome.storage.local.set({ tasks: tasks.slice(0, 20) });
        }
        sendResponse({ status: res.status });
      })
      .catch(() => sendResponse({ status: 0 }));
    return true;
  }
});
