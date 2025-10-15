// middlewares/logger.ts
import Koa from 'koa';
import pino from 'pino';

export const logger = pino({ level: process.env.LOG_LEVEL || 'debug' });

export const requestLogger = async (ctx: Koa.Context, next: Koa.Next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  logger.info({
    method: ctx.method,
    url: ctx.url,
    status: ctx.status,
    duration: ms + 'ms',
  });
};

export const errorLogger = async (ctx: Koa.Context, next: Koa.Next) => {
  try {
    await next();
  } catch (err) {
    logger.error({ err, method: ctx.method, url: ctx.url });
    throw err;
  }
};
