import { deepseekClient } from "../services/openaiService";

export const chatHandler = async (ctx: any) => {
  const { messages, stream } = ctx.request.body;

  if (!messages || !Array.isArray(messages)) {
    ctx.status = 400;
    ctx.body = { error: "messages 必须是数组" };
    return;
  }

  // 💡 在这里增加系统提示词，让模型风格更稳定
  const enhancedMessages = [
    {
      role: "system",
      content: `
你是一名专业的技术文档工程师，擅长撰写结构化、清晰、有条理的文档和解释。  
请在回答中使用 Markdown 格式输出内容，包括标题（#）、列表（- 或 1.）、代码块（\`\`\`）等。  
保持语言自然但专业，必要时可以用表格或加粗关键字来增强可读性。  
所有输出应尽量避免废话，直达重点，并具有良好的排版。`,
    },
    ...messages,
  ];

  if (stream) {
    // 流式 SSE
    ctx.status = 200;
    ctx.set("Content-Type", "text/event-stream");
    ctx.set("Cache-Control", "no-cache, no-transform");
    ctx.set("Connection", "keep-alive");

    try {
      await deepseekClient(enhancedMessages, { stream: true, res: ctx.res });
    } catch (err) {
      ctx.res.write(
        `event: error\ndata: ${JSON.stringify({ error: String(err) })}\n\n`
      );
      ctx.res.end();
    }

  } else {
    // 普通请求
    try {
      const result = await deepseekClient(enhancedMessages);
      ctx.status = 200;
      ctx.body = result;
    } catch (err) {
      ctx.status = 500;
      ctx.body = { error: String(err) };
    }
  }
};
