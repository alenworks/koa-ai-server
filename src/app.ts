import Koa from "koa";
import bodyParser from "koa-bodyparser";
import compress from "koa-compress";
import router from "./routes";

// 自定义中间件
import { errorHandler } from "./middlewares/errorHandler"; // 全局错误捕获
import { requestLogger } from "./middlewares/logger";      // 请求/响应日志
import { useSecurity } from "./middlewares/security";       // 安全相关中间件（CORS、Headers 等）
import * as logger from "./utils/logger";                  // 通用 logger 工具

const app = new Koa();

// ------------------------ 全局错误捕获 ------------------------
// 捕获所有未处理的异常，并记录日志
app.use(errorHandler);

// ------------------------ 请求日志 ------------------------
// 记录每次请求的 method、url、耗时等信息
app.use(requestLogger);

// ------------------------ 安全中间件 ------------------------
// 例如添加 CORS、XSS 防护、Content Security Policy 等
app.use(useSecurity());

// ------------------------ 请求体解析 ------------------------
// 限制请求体最大为 2MB
app.use(bodyParser({ jsonLimit: "2mb" }));

// ------------------------ Gzip 压缩 ------------------------
app.use(compress());

// ------------------------ 路由注册 ------------------------
app.use(router.routes());
app.use(router.allowedMethods());

// ------------------------ 全局进程异常处理 ------------------------
// 捕获未处理的 Promise reject
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection", { reason, promise });
});

// 捕获未捕获异常
process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception", { err });
  // 允许日志刷新后再退出
  setTimeout(() => process.exit(1), 100).unref();
});

// ------------------------ 启动服务 ------------------------
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  logger.info(`🚀 Koa 服务运行在 http://localhost:${PORT}`);
});

export default app;
