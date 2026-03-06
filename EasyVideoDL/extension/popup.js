const DEFAULT_SERVER_URL = 'http://localhost:6789';

const statusDot      = document.getElementById('statusDot');
const statusText     = document.getElementById('statusText');
const downloadDir    = document.getElementById('downloadDir');
const recheckBtn     = document.getElementById('recheckBtn');
const serverUrlInput = document.getElementById('serverUrlInput');
const saveUrlBtn     = document.getElementById('saveUrlBtn');
const formatBtns     = document.querySelectorAll('.format-btn');
const taskList       = document.getElementById('taskList');

let currentServerUrl = DEFAULT_SERVER_URL;
let pollTimer = null;

// 初始化
chrome.storage.sync.get(['format', 'serverUrl'], ({ format, serverUrl }) => {
  selectFormat(format || 'mp4');
  currentServerUrl = serverUrl || DEFAULT_SERVER_URL;
  serverUrlInput.value = currentServerUrl;
  checkServer();
});

loadTasks();

// 伺服器位址儲存
saveUrlBtn.addEventListener('click', () => {
  const url = serverUrlInput.value.trim().replace(/\/$/, '');
  if (!url) return;
  currentServerUrl = url;
  chrome.storage.sync.set({ serverUrl: url });
  checkServer();
});

serverUrlInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') saveUrlBtn.click();
});

// 格式選擇
formatBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    const fmt = btn.dataset.format;
    chrome.storage.sync.set({ format: fmt });
    selectFormat(fmt);
  });
});

function selectFormat(fmt) {
  formatBtns.forEach((b) => b.classList.toggle('selected', b.dataset.format === fmt));
}

// 伺服器狀態檢查（popup 在 chrome-extension:// 下，可直接 fetch HTTP）
async function checkServer() {
  setStatus('checking');
  recheckBtn.disabled = true;
  downloadDir.textContent = '';
  try {
    const res = await fetch(`${currentServerUrl}/status`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      setStatus('online');
      if (data.download_dir) downloadDir.textContent = `下載至：${data.download_dir}`;
    } else {
      setStatus('offline');
    }
  } catch {
    setStatus('offline');
  } finally {
    recheckBtn.disabled = false;
  }
}

function setStatus(state) {
  statusDot.className = `status-dot ${state}`;
  statusText.textContent = { online: '線上 - 伺服器運行中', offline: '離線 - 無法連線', checking: '檢查中...' }[state] || state;
}

recheckBtn.addEventListener('click', checkServer);

// ── 下載清單 ──────────────────────────────────────────

async function loadTasks() {
  const { tasks = [] } = await chrome.storage.local.get(['tasks']);
  renderTasks(tasks);
  schedulePoll(tasks);
}

function renderTasks(tasks) {
  if (tasks.length === 0) {
    taskList.innerHTML = '<div class="empty-tip">尚無下載紀錄</div>';
    return;
  }

  taskList.innerHTML = tasks.map((t) => {
    const stateIcon = { queued: '⏳', downloading: '⬇', done: '✅', error: '❌' }[t.status] || '⏳';
    const stateText = { queued: '排隊中', downloading: '下載中', done: '完成', error: '失敗' }[t.status] || t.status;
    const pct = t.progress ?? 0;
    const speed = t.speed ? ` · ${t.speed}` : '';
    const progressText = t.status === 'downloading' && t.progress != null ? ` ${pct}%${speed}` : '';
    const shortTitle = t.title.length > 32 ? t.title.slice(0, 30) + '…' : t.title;

    return `
      <div class="task-item ${t.status}" data-id="${t.task_id}">
        <button class="task-clear" data-id="${t.task_id}" title="移除">✕</button>
        <div class="task-title" title="${t.title}">${shortTitle}</div>
        <div class="task-status">${stateIcon} ${stateText}${progressText}</div>
        ${t.status !== 'done' && t.status !== 'error' ? `
          <div class="task-progress-bar">
            <div class="task-progress-fill" style="width:${pct}%"></div>
          </div>` : ''}
      </div>`;
  }).join('');

  // 移除按鈕事件
  taskList.querySelectorAll('.task-clear').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const { tasks = [] } = await chrome.storage.local.get(['tasks']);
      await chrome.storage.local.set({ tasks: tasks.filter((t) => t.task_id !== id) });
      loadTasks();
    });
  });
}

function schedulePoll(tasks) {
  clearTimeout(pollTimer);
  const hasActive = tasks.some((t) => t.status === 'queued' || t.status === 'downloading');
  if (hasActive) {
    pollTimer = setTimeout(() => pollActiveTasks(tasks), 2000);
  }
}

async function pollActiveTasks(tasks) {
  let changed = false;

  for (const task of tasks) {
    if (task.status !== 'queued' && task.status !== 'downloading') continue;
    try {
      const res = await fetch(`${task.serverUrl}/task/${task.task_id}`, {
        signal: AbortSignal.timeout(3000),
      });
      if (!res.ok) continue;
      const data = await res.json();
      if (data.status !== task.status || data.progress !== task.progress) {
        task.status   = data.status;
        task.progress = data.progress ?? task.progress;
        task.speed    = data.speed ?? null;
        changed = true;
      }
    } catch { /* 忽略單次失敗 */ }
  }

  if (changed) {
    await chrome.storage.local.set({ tasks });
    renderTasks(tasks);
  }

  schedulePoll(tasks);
}
