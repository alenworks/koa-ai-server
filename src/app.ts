import dotenv from "dotenv";
dotenv.config()
import Koa from "koa";
import bodyParser from "koa-bodyparser";
import aiRouter from "./routes/ai";

const app = new Koa();
// 中间件

app.use(bodyParser());
// 路由
app.use(aiRouter.routes()).use(aiRouter.allowedMethods());

// 启动服务
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(
    `🚀 Koa + TS AI SSE 服务运行在 http://localhost:${PORT}`
  );
});
app.on('error', (err: Error, ctx?: Koa.Context) => {
  console.error('Koa app error:', err, ctx ? { method: ctx.method, url: ctx.url } : undefined);
});

process.on('uncaughtException', (err: Error) => {
  console.error('Uncaught Exception:', err);
  // 允许日志刷新后再退出
  setTimeout(() => process.exit(1), 100).unref();
});

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// 基本的信号处理。要实现真正的优雅关闭，应保存由 app.listen(...) 返回的 server 并在此调用 server.close(...)
['SIGINT', 'SIGTERM'].forEach((signal) =>
  process.on(signal, () => {
    console.log(`Received ${signal}, exiting...`);
    setTimeout(() => process.exit(0), 100).unref();
  })
);

export default app;
