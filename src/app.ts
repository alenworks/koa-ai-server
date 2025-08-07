import dotnev from "dotenv";
dotnev.config()
import Koa from "koa";
import bodyParser from "koa-bodyparser";
import aiRouter from "./routes/ai";

const app = new Koa();
// 中间件

app.use(bodyParser());
// 路由
app.use(aiRouter.routes()).use(aiRouter.allowedMethods());

// 启动服务
app.listen(process.env.PORT, () => {
  console.log(
    `🚀 Koa + TS AI SSE 服务运行在 http://localhost:${process.env.PORT}`
  );
});
