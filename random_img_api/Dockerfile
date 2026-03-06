# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

# better-sqlite3 需要編譯原生模組
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json .
COPY src ./src
RUN npm run build

# ── Stage 2: Production image ──────────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

# 從 builder 複製已編譯的 node_modules（含原生 .node 檔）
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package*.json ./

# 移除 devDependencies（node_modules 已存在，只做 prune）
RUN npm prune --omit=dev

# 建立圖片目錄（volume mount 點）
RUN mkdir -p /data/images

ENV NODE_ENV=production
ENV IMAGES_DIR=/data/images
ENV DB_PATH=/data/db.sqlite

EXPOSE 3000

CMD ["node", "dist/index.js"]
