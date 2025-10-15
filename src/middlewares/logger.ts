// src/middlewares/logger.ts
import Koa from 'koa';
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import { sendSSE } from '@/utils/sse';
import * as rfs from 'rotating-file-stream';

// ------------------------ 日志目录 ------------------------
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

// ------------------------ 文件流 ------------------------
// 每天生成一个新文件，单文件最大 50MB，过期文件压缩
const accessLogStream = rfs.createStream('access.log', {
  interval: '1d',
  path: logDir,
  maxSize: '50M',
  compress: 'gzip',
});

// ------------------------ Pino 实例 ------------------------
const isDev = process.env.NODE_ENV !== 'production';

const streams: pino.StreamEntry[] = [
  isDev
    ? { stream: pino.transport({ target: 'pino-pretty', options: { colorize: true, translateTime: true, ignore: 'pid,hostname' } }) }
    : { stream: process.stdout },
  { stream: accessLogStream },
];

export const logger = pino({ level: process.env.LOG_LEVEL || 'debug' }, pino.multistream(streams));
// ------------------------ 通用日志封装 ------------------------
export const info = (msg: string, meta?: any) => {
  if (isDev) {
    const logStr = meta ? `${msg} ${JSON.stringify(meta)}` : msg;
    console.log(logStr); // 直接用 console 输出，终端不会乱码
  } else {
    logger.info(meta ? { meta } : {}, msg);
  }
};

export const warn = (msg: string, meta?: any) => {
  if (isDev) {
    const logStr = meta ? `${msg} ${JSON.stringify(meta)}` : msg;
    console.warn(logStr);
  } else {
    logger.warn(meta ? { meta } : {}, msg);
  }
};

export const error = (msg: string, meta?: any) => {
  if (isDev) {
    const logStr = meta ? `${msg} ${JSON.stringify(meta)}` : msg;
    console.error(logStr);
  } else {
    logger.error(meta ? { meta } : {}, msg);
  }
};

// ------------------------ 流式日志 ------------------------
export const streamLog = (res: any, message: string, event?: string) => {
  if (res) sendSSE(res, event ? { event, data: message } : { content: message });
  const logMessage = `[STREAM] ${message}`;
  if (isDev) console.log(logMessage);
  accessLogStream.write(logMessage + '\n');
};

// ------------------------ HTTP 请求/响应 ------------------------
export const logRequest = (ctx: Koa.Context) => {
  const body = ctx.request.body ? JSON.stringify(ctx.request.body) : '';
  info(`HTTP ${ctx.method} ${ctx.url}`, { body });
};

export const logResponse = (ctx: Koa.Context, status: number, data?: any) => {
  const body = data ? JSON.stringify(data) : '';
  info(`HTTP ${ctx.method} ${ctx.url} -> ${status}`, { body });
};

// ------------------------ 进程异常 ------------------------
export const handleProcessErrors = () => {
  process.on('uncaughtException', (err) => {
    error('Uncaught Exception', { err });
    setTimeout(() => process.exit(1), 100).unref();
  });

  process.on('unhandledRejection', (reason, promise) => {
    error('Unhandled Rejection', { reason, promise });
  });
};

// ------------------------ Koa 中间件 ------------------------
export const requestLogger = async (ctx: Koa.Context, next: Koa.Next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  info(`HTTP ${ctx.method} ${ctx.url}`, { status: ctx.status, duration: `${ms}ms`, body: ctx.request.body });
};

export const errorLogger = async (ctx: Koa.Context, next: Koa.Next) => {
  try {
    await next();
  } catch (err) {
    error('Koa Error', { err, method: ctx.method, url: ctx.url, body: ctx.request.body });
    throw err;
  }
};
