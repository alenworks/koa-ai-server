# 使用官方 Node 镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /usr/src/app

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3001

# 安装 pnpm
RUN npm install -g pnpm

# 复制依赖文件
COPY package.json pnpm-lock.yaml ./

# 安装依赖（生产依赖）
RUN pnpm install --frozen-lockfile --prod

# 复制源代码
COPY . .

# 构建 TypeScript 并处理路径别名（确保 package.json build 命令包含 tsc && tsc-alias）
RUN pnpm run build

# 创建非 root 用户
RUN addgroup -S app && adduser -S -G app app \
    && chown -R app:app /usr/src/app
USER app

# 暴露端口
EXPOSE ${PORT}

# 启动命令
CMD ["pnpm", "run", "start"]
