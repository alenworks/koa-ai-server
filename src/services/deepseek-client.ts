/**
 * @description deepseek demo https://www.deepseek.com/
 */
import OpenAI from "openai";
import { sendSSE } from "@/utils/sse";
const openai = new OpenAI({
  // 若没有配置环境变量，请用百炼API Key将下行替换为：apiKey: "sk-xxx",
  // apiKey: process.env.OPENAI_API_KEY, // 如何获取API Key：https://help.aliyun.com/zh/model-studio/developer-reference/get-api-key
  apiKey: process.env.OPENAI_API_KEY || "",
  baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
});

export async function deepseekClient(
  messages: {
    role: "user" | "assistant" | "system";
    content: string; // 必须的！
    name?: string; // 可选的，一般用于区分不同用户（多用户聊天等场景，很少用）
  }[],
  res: any
) {
  try {
    const stream = await openai.chat.completions.create({
      model: "deepseek-v3",
      messages: messages,
      stream: true,
    });

    console.log("\n" + "=".repeat(20) + "思考过程" + "=".repeat(20) + "\n");

    // 打印 stream
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content && content.trim() !== "") {
        //避免纯空白字符
        process.stdout.write(content);
        sendSSE(res, { content });
      }
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    res.end();
  }
}
console.log("go...");
