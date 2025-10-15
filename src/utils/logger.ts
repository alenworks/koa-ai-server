// src/utils/logger.ts
import fs from 'fs';
import path from 'path';
import { sendSSE } from "@/utils/sse";

// 确保 logs 目录存在
const logDir = path.resolve(__dirname, '../../logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

// 写入文件的 stream
const appLogStream = fs.createWriteStream(path.join(logDir, 'app.log'), { flags: 'a' });
const streamLogStream = fs.createWriteStream(path.join(logDir, 'stream.log'), { flags: 'a' });

// 通用时间戳
const timestamp = () => new Date().toISOString();

// =================== 普通日志 ===================
export const info = (message: string, meta?: any) => {
  const logMessage = `[INFO] ${timestamp()} - ${message} ${meta ? JSON.stringify(meta) : ''}`;
  console.log(logMessage);
  appLogStream.write(logMessage + '\n');
};

export const warn = (message: string, meta?: any) => {
  const logMessage = `[WARN] ${timestamp()} - ${message} ${meta ? JSON.stringify(meta) : ''}`;
  console.warn(logMessage);
  appLogStream.write(logMessage + '\n');
};

export const error = (message: string, meta?: any) => {
  const logMessage = `[ERROR] ${timestamp()} - ${message} ${meta ? JSON.stringify(meta) : ''}`;
  console.error(logMessage);
  appLogStream.write(logMessage + '\n');
};

// =================== SSE/流式日志 ===================
export const streamLog = (res: any, message: string, event?: string) => {
  if (res) {
    sendSSE(res, event ? { event, data: message } : { content: message });
  }
  const logMessage = `[STREAM] ${timestamp()} - ${message}`;
  console.log(logMessage);
  streamLogStream.write(logMessage + '\n');
};

// =================== HTTP 请求/响应 ===================
export const logRequest = (ctx: any) => {
  const body = ctx.request.body ? JSON.stringify(ctx.request.body) : '';
  info(`HTTP ${ctx.method} ${ctx.url}`, { body });
};

export const logResponse = (ctx: any, status: number, data?: any) => {
  const body = data ? JSON.stringify(data) : '';
  info(`HTTP ${ctx.method} ${ctx.url} -> ${status}`, { body });
};

// =================== 进程异常 ===================
export const handleProcessErrors = () => {
  process.on("uncaughtException", (err) => {
    error("Uncaught Exception", { err });
    setTimeout(() => process.exit(1), 100).unref();
  });

  process.on("unhandledRejection", (reason, promise) => {
    error("Unhandled Rejection", { reason, promise });
  });
};
