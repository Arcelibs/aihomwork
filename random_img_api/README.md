# rancom-img-api

個人私用隨機圖片 API，支援 Bearer Token 驗證、分類管理、圖片上傳。

## Docker 部署（推薦）

### 1. 設定環境變數

```bash
cp .env.example .env
# 編輯 .env，填寫 ADMIN_KEY 和 BASE_URL
# IMAGES_DIR 和 DB_PATH 不需改，docker-compose 已設定好
```

### 2. 啟動容器

```bash
docker compose up -d --build
```

### 3. Token 管理（在容器終端執行）

```bash
# 新增 token
docker exec -it rancom-img-api node /app/dist/cli.js token:create my-app

# 列出所有 token
docker exec -it rancom-img-api node /app/dist/cli.js token:list

# 撤銷 token
docker exec -it rancom-img-api node /app/dist/cli.js token:revoke 1

# 列出分類
docker exec -it rancom-img-api node /app/dist/cli.js category:list
```

### 4. 上傳圖片

圖片直接放到 VPS 的 `./data/images/<分類名>/` 目錄即可（不需重啟容器）：
```bash
mkdir -p ./data/images/nature
cp photo.jpg ./data/images/nature/
```

或透過 API 上傳：
```bash
curl -X POST http://localhost:3000/admin/upload \
  -H "X-Admin-Key: 你的ADMIN_KEY" \
  -F "category=nature" \
  -F "file=@photo.jpg"
```

---

## 本機開發

### 1. 安裝依賴

```bash
npm install
```

### 2. 設定環境變數

```bash
cp .env.example .env
```

編輯 `.env`，至少填寫 `ADMIN_KEY` 和 `BASE_URL`：

```env
PORT=3000
NODE_ENV=production
ADMIN_KEY=你的強密碼            # 管理端點用的金鑰
IMAGES_DIR=./data/images
DB_PATH=./data/db.sqlite
DEFAULT_RESPONSE_FORMAT=stream  # stream（直接回傳圖片）或 json
BASE_URL=https://your-domain.com
```

### 3. 建立圖片目錄

```bash
mkdir -p data/images
```

### 4. 啟動

**開發模式（熱重載）：**
```bash
npm run dev
```

**生產模式：**
```bash
npm run build
npm start
```

**使用 PM2（推薦生產環境）：**
```bash
npm run build
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

---

## 使用流程

### Step 1：發放 Token

先透過管理端點建立一個 Token（完整值只顯示一次，請妥善保存）：

```bash
curl -X POST http://localhost:3000/admin/tokens \
  -H "X-Admin-Key: 你的ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name":"我的應用"}'
```

回應：
```json
{
  "token": "E6GADJ2dCzPfE3k93QCrTL3106sgdT4j",
  "name": "我的應用",
  "message": "Store this token safely — it will not be shown again."
}
```

### Step 2：上傳圖片

```bash
curl -X POST http://localhost:3000/admin/upload \
  -H "X-Admin-Key: 你的ADMIN_KEY" \
  -F "category=nature" \
  -F "file=@/path/to/photo.jpg"
```

圖片會存到 `data/images/nature/photo.jpg`。也可以直接手動把圖片放到 `data/images/<分類名>/` 目錄下。

### Step 3：取得隨機圖片

```bash
# 直接下載圖片（stream 模式）
curl -H "Authorization: Bearer E6GADJ2dCzPfE3k93QCrTL3106sgdT4j" \
  http://localhost:3000/random -o image.jpg

# 指定分類
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/random/nature -o image.jpg

# 使用 query 帶 token（適合瀏覽器直連）
http://localhost:3000/random?token=<token>
```

---

## API 端點

### 公開端點

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/` | HTML 說明頁（列出所有可用分類） |

### 需要 Bearer Token

認證方式：`Authorization: Bearer <token>` header，或 `?token=<token>` query。

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/random` | 全庫隨機取一張圖片 |
| GET | `/random/:category` | 指定分類隨機取一張 |
| GET | `/image/:category/:filename` | 取得指定圖片 |

**回傳格式：**
- 預設 stream（直接回傳圖片二進位，`Content-Type` 自動偵測）
- 加 `?format=json` 改為 JSON：
  ```json
  { "filename": "photo.jpg", "category": "nature", "url": "https://your-domain.com/image/nature/photo.jpg" }
  ```

### 需要 Admin Key

認證方式：`X-Admin-Key: <ADMIN_KEY>` header。

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/admin/tokens` | 列出所有 token（只顯示前 8 碼） |
| POST | `/admin/tokens` | 新增 token，body: `{"name":"描述"}` |
| DELETE | `/admin/tokens/:id` | 撤銷指定 token |
| GET | `/admin/categories` | 列出所有分類 |
| POST | `/admin/upload` | 上傳圖片（multipart/form-data，欄位：`category`, `file`） |

---

## curl 範例大全

```bash
# 設定變數方便複製貼上
ADMIN_KEY="你的ADMIN_KEY"
TOKEN="你的TOKEN"
BASE="http://localhost:3000"

# ── Token 管理 ──────────────────────────────────

# 列出所有 token
curl "$BASE/admin/tokens" -H "X-Admin-Key: $ADMIN_KEY"

# 新增 token
curl -X POST "$BASE/admin/tokens" \
  -H "X-Admin-Key: $ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name":"my-app"}'

# 撤銷 token（id 從列表取得）
curl -X DELETE "$BASE/admin/tokens/1" \
  -H "X-Admin-Key: $ADMIN_KEY"

# ── 圖片管理 ──────────────────────────────────

# 列出所有分類
curl "$BASE/admin/categories" -H "X-Admin-Key: $ADMIN_KEY"

# 上傳圖片到 nature 分類
curl -X POST "$BASE/admin/upload" \
  -H "X-Admin-Key: $ADMIN_KEY" \
  -F "category=nature" \
  -F "file=@./photo.jpg"

# ── 取得圖片 ──────────────────────────────────

# 全庫隨機（下載）
curl -H "Authorization: Bearer $TOKEN" "$BASE/random" -o out.jpg

# 全庫隨機（取 JSON 看路徑）
curl -H "Authorization: Bearer $TOKEN" "$BASE/random?format=json"

# 指定分類隨機
curl -H "Authorization: Bearer $TOKEN" "$BASE/random/nature" -o out.jpg

# 取指定圖片
curl -H "Authorization: Bearer $TOKEN" "$BASE/image/nature/photo.jpg" -o out.jpg

# 用 query token（例如在瀏覽器 img src 直接用）
# $BASE/random?token=$TOKEN&format=json
```

---

## 圖片存放規則

```
data/images/
├── nature/        ← 分類名（資料夾名）
│   ├── photo1.jpg
│   └── photo2.png
├── anime/
│   └── art.webp
└── ...
```

- 支援格式：`.jpg` `.jpeg` `.png` `.gif` `.webp` `.avif` `.bmp` `.svg`
- 可以直接手動把圖片丟進去，API 會自動掃描（不需重啟）
- 分類名就是資料夾名，建議用小寫英文

---

## 部署（VPS）

### Nginx 反代設定

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_buffering off;   # 圖片 stream 必要
    }
}
```

### HTTPS（Let's Encrypt）

```bash
certbot --nginx -d your-domain.com
```

---

## 專案結構

```
rancom_img_api/
├── src/
│   ├── index.ts               # 入口點
│   ├── db.ts                  # SQLite 初始化
│   ├── types.ts               # TypeScript 型別
│   ├── middleware/
│   │   ├── auth.ts            # Token 驗證
│   │   └── adminAuth.ts       # Admin Key 驗證
│   ├── routes/
│   │   ├── docs.ts            # 說明頁
│   │   ├── image.ts           # 圖片端點
│   │   └── admin.ts           # 管理端點
│   └── services/
│       ├── tokenService.ts    # Token CRUD
│       └── imageService.ts    # 圖片掃描與存取
├── data/
│   ├── db.sqlite              # 自動建立
│   └── images/               # 圖片根目錄
├── dist/                      # 編譯輸出
├── .env                       # 環境變數（不提交 git）
├── .env.example
├── ecosystem.config.js        # PM2 設定
├── package.json
└── tsconfig.json
```
