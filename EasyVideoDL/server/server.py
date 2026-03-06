"""
EasyVideoDL 本地下載伺服器
Flask + yt-dlp，支援本地執行與 Docker 部署
"""

import os
import threading
import uuid
from pathlib import Path

from flask import Flask, jsonify, request
from flask_cors import CORS
import yt_dlp

app = Flask(__name__)

# CORS：允許來自 Chrome 擴充功能的請求（不限 origin，因為內網 IP 不固定）
CORS(app, origins=r".*")

# 任務狀態儲存（記憶體）
tasks: dict[str, dict] = {}

# 下載目錄：優先讀環境變數，fallback 至 ~/Downloads
_env_dir = os.environ.get("DOWNLOAD_DIR", "")
DOWNLOAD_DIR = Path(_env_dir) if _env_dir else Path.home() / "Downloads"

FORMAT_MAP = {
    "mp4":                 "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
    "mp4-720p":            "bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720][ext=mp4]/best[height<=720]",
    "bestvideo+bestaudio": "bestvideo+bestaudio/best",
    "mp3":                 "bestaudio/best",
}


def validate_url(url: str) -> bool:
    from urllib.parse import urlparse
    try:
        host = urlparse(url).netloc.lower().removeprefix('www.')
        return host in {'youtube.com', 'youtu.be'}
    except Exception:
        return False


def make_progress_hook(task_id: str):
    def hook(d):
        if d["status"] == "downloading":
            downloaded = d.get("downloaded_bytes") or 0
            total = d.get("total_bytes") or d.get("total_bytes_estimate") or 0
            tasks[task_id]["progress"] = int(downloaded / total * 100) if total else None
            speed = d.get("speed") or 0
            tasks[task_id]["speed"] = f"{speed / 1_048_576:.1f} MB/s" if speed else None
        elif d["status"] == "finished":
            tasks[task_id]["progress"] = 100
            tasks[task_id]["speed"] = None
    return hook


def run_download(task_id: str, url: str, fmt: str):
    """在背景執行緒中執行 yt-dlp 下載"""
    tasks[task_id]["status"] = "downloading"

    ydl_opts = {
        "outtmpl": str(DOWNLOAD_DIR / "%(title)s.%(ext)s"),
        "quiet": True,
        "no_warnings": True,
        "progress_hooks": [make_progress_hook(task_id)],
    }

    if fmt == "mp3":
        ydl_opts["format"] = FORMAT_MAP["mp3"]
        ydl_opts["postprocessors"] = [{
            "key": "FFmpegExtractAudio",
            "preferredcodec": "mp3",
            "preferredquality": "192",
        }]
    else:
        ydl_opts["format"] = FORMAT_MAP.get(fmt, FORMAT_MAP["mp4"])

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])
        tasks[task_id]["status"] = "done"
        tasks[task_id]["progress"] = 100
        tasks[task_id]["speed"] = None
    except Exception as exc:
        tasks[task_id]["status"] = "error"
        tasks[task_id]["error"] = str(exc)


@app.get("/status")
def status():
    return jsonify({"status": "ok", "version": "1.0.0", "download_dir": str(DOWNLOAD_DIR)})


@app.post("/download")
def download():
    data = request.get_json(silent=True) or {}
    url = data.get("url", "").strip()
    fmt = data.get("format", "best").strip()

    if not url:
        return jsonify({"error": "缺少 url 參數"}), 400

    if not validate_url(url):
        return jsonify({"error": "不支援的 URL，請提供 YouTube 連結"}), 400

    if fmt not in FORMAT_MAP:
        fmt = "best"

    task_id = str(uuid.uuid4())
    tasks[task_id] = {"status": "queued", "url": url, "format": fmt}

    thread = threading.Thread(
        target=run_download,
        args=(task_id, url, fmt),
        daemon=True,
    )
    thread.start()

    return jsonify({"task_id": task_id, "status": "queued"}), 202


@app.get("/task/<task_id>")
def get_task(task_id: str):
    task = tasks.get(task_id)
    if task is None:
        return jsonify({"error": "找不到任務"}), 404
    return jsonify({"task_id": task_id, **task})


if __name__ == "__main__":
    DOWNLOAD_DIR.mkdir(parents=True, exist_ok=True)
    # 綁定 0.0.0.0 使內網其他裝置可存取
    bind_host = os.environ.get("BIND_HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", 6789))
    print(f"EasyVideoDL 伺服器啟動中...")
    print(f"下載目錄：{DOWNLOAD_DIR}")
    print(f"監聽位址：http://{bind_host}:{port}")
    app.run(host=bind_host, port=port, debug=False)
