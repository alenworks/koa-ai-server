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
    ctx.status = 200;
    ctx.set("Content-Type", "text/event-stream");
    ctx.set("Cache-Control", "no-cache, no-transform");
    ctx.set("Connection", "keep-alive");

    try {
      // deepseekClient 内部直接写入 ctx.res 并结束
      await deepseekClient(messages, { stream: true, res: ctx.res });
    } catch (err) {
      // 如果 deepseekClient 内部抛错，保证流式返回错误事件
      ctx.res.write(`event: error\ndata: ${JSON.stringify({ error: String(err) })}\n\n`);
      ctx.res.end();
    }

  } else {
    // 普通请求
    try {
      const result = await deepseekClient(messages);
      ctx.status = 200;
      ctx.body = result;
    } catch (err) {
      ctx.status = 500;
      ctx.body = { error: String(err) };
    }
  }
};
