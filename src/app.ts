import Koa from "koa";
import bodyParser from "koa-bodyparser";
import compress from "koa-compress";
import router from "./routes";

// 中间件
import { errorHandler } from "./middlewares/errorHandler"; // 全局错误捕获
import { requestLogger } from "./middlewares/logger";      // 请求/响应日志
import { useSecurity } from "./middlewares/security";       // 安全相关中间件
import * as logger from "./utils/logger";                  // 通用 logger 工具

const app = new Koa();

// ------------------------ 全局错误捕获 ------------------------
app.use(errorHandler);  // 捕获路由中未处理的异常

// ------------------------ 请求日志 ------------------------
app.use(requestLogger); // 记录 method/url/body 等信息

// ------------------------ 安全中间件 ------------------------
app.use(useSecurity()); // CORS/XSS/Content-Security 等

// ------------------------ 请求体解析 ------------------------
app.use(bodyParser({ jsonLimit: "2mb" }));

// ------------------------ Gzip 压缩 ------------------------
app.use(compress());

// ------------------------ 路由 ------------------------
app.use(router.routes());
app.use(router.allowedMethods());

// ------------------------ 全局进程异常 ------------------------
logger.handleProcessErrors(); // 已封装 uncaughtException / unhandledRejection

// ------------------------ SSE / 流式日志统一 ------------------------
// 这里给 SSE 流式请求添加中间件（可选）
// 将 res 附加 logger，所有 sendSSE 可以统一写文件/控制台
app.use(async (ctx, next) => {
  if (ctx.path.startsWith("/api/ai/chat/stream")) {
    // ctx.state.loggerStream 用于 deepseekClient 里调用
    ctx.state.loggerStream = (message: string, event?: string) => {
      logger.streamLog(ctx.res, message, event);
    };
  }
  await next();
});

// ------------------------ 启动服务 ------------------------
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  logger.info(`🚀 Koa 服务运行在 http://localhost:${PORT}`);
});

export default app;
