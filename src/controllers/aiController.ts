import { deepseekClient } from "../services/openaiService";

export const chatHandler = async (ctx: any) => {
  const { messages, stream } = ctx.request.body;
  if (!messages || !Array.isArray(messages)) {
    ctx.status = 400;
    ctx.body = { error: "messages 必须是数组" };
    return;
  }

  if (stream) {
    // 流式 SSE
    ctx.set("Content-Type", "text/event-stream");
    ctx.set("Cache-Control", "no-cache, no-transform");
    ctx.set("Connection", "keep-alive");

    await deepseekClient(messages, { stream: true, res: ctx.res });
    // 注意流式模式内部已经调用 res.end()
  } else {
    // 普通请求
    const result = await deepseekClient(messages);
    ctx.body = result;
  }
};