import Router from "koa-router";
import { chatHandler } from "../controllers/aiController";
import { rateLimitRedis } from "../middlewares/rateLimitRedis";
const router = new Router({ prefix: "/ai" });

// 统一 POST /chat 接口，根据 body.stream 判断是否流式
router.post("/chat", chatHandler);

// 可选保留 /chat/stream 兼容老前端，内部直接调用 chatHandler
router.post("/chat/stream",rateLimitRedis, async (ctx) => {
  // 将请求 body 强制添加 stream: true
  (ctx.request.body as any).stream = true;
  await chatHandler(ctx);
});

// 🩺 健康检测接口（不消耗 token）
router.get("/health", (ctx) => {
  ctx.body = {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };
});

// 🧠 深度检测接口
router.get("/deepcheck", async (ctx) => {
  try {
    // 注意：这会真正调用 AI，一般建议低频触发
    const result = await chatHandler([
      { role: "user", content: "ping" },
    ]);
    ctx.body = { status: "ok", result };
  } catch (err) {
    ctx.status = 500;
    ctx.body = { status: "error", message: String(err) };
  }
});

export default router;
