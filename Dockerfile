# ---------- Stage 1: Build ----------
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

# 安装 pnpm
RUN npm install -g pnpm

# 复制依赖文件
COPY package.json pnpm-lock.yaml ./

# 安装所有依赖（包括 devDependencies）
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 构建 TypeScript
RUN pnpm run build

# ---------- Stage 2: Production ----------
FROM node:18-alpine

WORKDIR /usr/src/app

ENV NODE_ENV=production
ENV PORT=3001

# 安装 pnpm
RUN npm install -g pnpm

# 复制 package.json 和 pnpm-lock.yaml 以便安装生产依赖
COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile --prod

# 复制构建好的 dist 文件
COPY --from=builder /usr/src/app/dist ./dist

# 复制必要的静态文件或配置文件（如 .env）
# COPY --from=builder /usr/src/app/.env ./

# 创建非 root 用户
RUN addgroup -S app && adduser -S -G app app \
    && chown -R app:app /usr/src/app
USER app

EXPOSE ${PORT}

CMD ["pnpm", "run", "start"]
