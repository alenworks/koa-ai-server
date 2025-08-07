import Router from "koa-router";
import { chatHandler } from "../controllers/aiController";
import { deepseekClient } from "../services/openaiService";
import { startSSE, sendSSE } from "../utils/sse";

const router = new Router({ prefix: "/api/ai" });

// 普通 POST /chat 接口（非流式）
router.post("/chat", chatHandler);

// SSE 流式接口 POST /chat/stream
router.post("/chat/stream", async (ctx) => {
  const { messages } = ctx.request.body as any;

  if (!messages || !Array.isArray(messages)) {
    ctx.status = 400;
    ctx.body = { error: "messages 必须是数组" };
    return;
  }
  const res = ctx.res;

  // 设置 SSE 响应头
  startSSE(res);

  try {
    await deepseekClient(messages, res);
  } catch (error) {
    console.error("SSE 出错:", error);
    sendSSE(res, { error: "服务器内部错误" });
    res.end();
  }
});

export default router;
