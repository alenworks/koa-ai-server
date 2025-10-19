import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import compress from 'koa-compress';
import router from './routes';
import * as logger from './middlewares/logger';
import { errorHandler } from './middlewares/errorHandler';
import { useSecurity } from './middlewares/security';
const app = new Koa();

// ------------------------ 全局错误捕获 ------------------------
app.use(errorHandler);

// ------------------------ 错误日志 ------------------------
app.use(logger.errorLogger);

// ------------------------ 请求日志 ------------------------
app.use(logger.requestLogger);

// ------------------------ 安全中间件 ------------------------
app.use(useSecurity());

// ------------------------ 请求体解析 ------------------------
app.use(bodyParser({ jsonLimit: '2mb' }));

// ------------------------ Gzip 压缩 ------------------------
app.use(compress());

// ------------------------ SSE/流式日志中间件 ------------------------
app.use(async (ctx, next) => {
  if (ctx.path.startsWith('/api/ai/chat/stream')) {
    ctx.state.loggerStream = (message: string, event?: string) => {
      logger.streamLog(ctx.res, message, event);
    };
  }
  await next();
});

// ------------------------ 路由 ------------------------
app.use(router.routes());
app.use(router.allowedMethods());

// ------------------------ 全局未捕获异常 ------------------------
logger.handleProcessErrors();
app.use(async (ctx, next) => {
  console.log('收到请求:', ctx.method, ctx.url)
  await next()
  console.log('响应状态:', ctx.status)
})
// ------------------------ 启动服务 ------------------------
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  logger.info(`🚀 Koa 服务运行在 http://localhost:${PORT}`);
});

export default app;
