import Router from "koa-router";
import { chatHandler } from "../controllers/aiController";

const router = new Router({ prefix: "/ai" });

// 统一 POST /chat 接口，根据 body.stream 判断是否流式
router.post("/chat", chatHandler);

// 可选保留 /chat/stream 兼容老前端，内部直接调用 chatHandler
router.post("/chat/stream", async (ctx) => {
  // 将请求 body 强制添加 stream: true
  (ctx.request.body as any).stream = true;
  await chatHandler(ctx);
});

export default router;
