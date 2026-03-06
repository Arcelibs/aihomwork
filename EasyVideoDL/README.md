# EasyVideoDL

Chrome/Edge 擴充功能 + 本地 Python Flask 伺服器，在 YouTube 頁面一鍵下載影片。

## 架構

```
瀏覽器（content.js）→ HTTP → 本地伺服器（Flask + yt-dlp）→ ~/Downloads/
```

---

## 安裝步驟

### 一、伺服器端

**需求：** Python 3.10+、pip

```bash
# 1. 進入 server 目錄
cd EasyVideoDL/server

# 2. 安裝依賴套件
pip install -r requirements.txt

# 3. 啟動伺服器
python server.py
```

伺服器啟動後會在 `http://127.0.0.1:6789` 監聽。
下載的影片會儲存至 `~/Downloads/`（Windows 為 `C:\Users\你的帳號\Downloads\`）。

> **MP3 下載需求：** 需安裝 [FFmpeg](https://ffmpeg.org/download.html) 並加入系統 PATH。

---

### 二、擴充功能端

1. 開啟 Chrome/Edge，前往 `chrome://extensions/`（Edge 為 `edge://extensions/`）
2. 開啟右上角「開發人員模式」
3. 點擊「載入未封裝項目」
4. 選擇 `EasyVideoDL/extension/` 資料夾
5. 擴充功能載入完成，圖示會出現在工具列

---

## 日常使用

1. 啟動伺服器（見上方步驟）
2. 前往任意 YouTube 影片頁面（`youtube.com/watch?v=...`）
3. 找到影片操作列（按讚、分享等按鈕旁），點擊「⬇ 下載」按鈕
4. 狀態依序變為：`確認中...` → `下載中...` → `✅ 完成！`
5. 影片存至 `~/Downloads/`

### 格式選擇

點擊工具列的擴充功能圖示可開啟設定面板，選擇下載格式：

| 格式 | 說明 |
|------|------|
| 最佳畫質（預設）| yt-dlp 自動選最佳 MP4 |
| MP4 | 強制 MP4 容器 |
| MP3 | 僅音訊，轉換為 MP3（需 FFmpeg） |
| 最高品質 | bestvideo+bestaudio（檔案較大） |

### 查詢下載進度（API）

```bash
# 檢查伺服器狀態
curl http://localhost:6789/status

# 查詢任務進度（task_id 從 POST /download 回傳）
curl http://localhost:6789/task/{task_id}
```

---

## Windows 開機自動啟動伺服器

建立 `start_server.bat`：

```bat
@echo off
cd /d "C:\你的路徑\EasyVideoDL\server"
python server.py
pause
```

**加入開機啟動：**

1. 按 `Win + R`，輸入 `shell:startup`，開啟開機啟動資料夾
2. 將 `start_server.bat` 的捷徑放入該資料夾

或使用工作排程器（背景執行，無視窗）：

```bat
schtasks /create /tn "EasyVideoDL" /tr "python C:\你的路徑\EasyVideoDL\server\server.py" /sc onlogon /ru "%USERNAME%"
```

---

## 疑難排解

| 問題 | 解決方法 |
|------|----------|
| 按鈕顯示「🔌 伺服器未啟動」 | 確認 `python server.py` 已執行 |
| MP3 轉換失敗 | 安裝 FFmpeg 並確認已加入 PATH |
| 按鈕沒出現 | 重新整理頁面；確認擴充功能已啟用 |
| 下載失敗 | 確認 yt-dlp 為最新版本：`pip install -U yt-dlp` |
