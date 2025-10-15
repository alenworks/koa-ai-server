import dotenv from "dotenv";
dotenv.config();
import Koa from "koa";
import bodyParser from "koa-bodyparser";
import aiRouter from "./routes/ai";

const app = new Koa();

// ======= 全局请求日志中间件 =======
app.use(async (ctx, next) => {
  const start = Date.now();
  console.log(`--> [${ctx.method}] ${ctx.url}`);
  try {
    await next();
    const ms = Date.now() - start;
    console.log(`<-- [${ctx.method}] ${ctx.url} ${ctx.status} ${ms}ms`);
  } catch (err) {
    console.error(`[ERROR] ${ctx.method} ${ctx.url}:`, err);
    ctx.status = 500;
    ctx.body = { message: "Internal Server Error" };
  }
});

// ======= 中间件 =======
app.use(bodyParser());

// ======= 路由 =======
app.use(aiRouter.routes()).use(aiRouter.allowedMethods());

// ======= 启动服务 =======
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Koa + TS AI SSE 服务运行在端口 ${PORT}`);
});

// ======= 错误处理 =======
app.on("error", (err: Error, ctx?: Koa.Context) => {
  console.error("Koa app error:", err, ctx ? { method: ctx.method, url: ctx.url } : undefined);
});

// ======= 进程异常捕获 =======
process.on("uncaughtException", (err: Error) => {
  console.error("Uncaught Exception:", err);
  // 让日志写入 FC
  setTimeout(() => process.exit(1), 100).unref();
});

process.on("unhandledRejection", (reason: any, promise: Promise<any>) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

// ======= 优雅退出 =======
["SIGINT", "SIGTERM"].forEach((signal) =>
  process.on(signal, () => {
    console.log(`Received ${signal}, exiting...`);
    setTimeout(() => process.exit(0), 100).unref();
  })
);

export default app;
