import Router from "koa-router";

const router = new Router();

/**
 * ✅ 测试接口：用来检查 Koa 是否正常运行
 * GET /api/ai/test
 */
router.get("/test", async (ctx) => {
  console.log("✅ 收到 /api/ai/test 请求");
  ctx.body = {
    status: "ok",
    message: "Koa 路由已连通",
    env: process.env.NODE_ENV || "unknown",
    time: new Date().toISOString(),
  };
});

export default router;
