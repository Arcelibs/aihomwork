FROM python:3.12-slim

# 安裝 FFmpeg（MP3 轉換需要）
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY server.py .

# 下載目錄由外部 volume 掛載
VOLUME ["/downloads"]

EXPOSE 6789

CMD ["python", "server.py"]
