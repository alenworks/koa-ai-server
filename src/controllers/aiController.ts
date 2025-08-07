// 普通 POST /chat 接口（非流式，直接返回模拟数据）
export async function chatHandler(ctx: any) {
  const { messages } = ctx.request.body;

  if (!messages || !Array.isArray(messages)) {
    ctx.status = 400;
    ctx.body = { error: 'messages 必须是数组' };
    return;
  }

  // 模拟返回（实际应该调用 OpenAI）
  ctx.body = {
    reply: '这是来自普通接口的模拟 AI 回答。',
    receivedMessages: messages,
  };
}