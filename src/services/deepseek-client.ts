/**
 * @description deepseek demo https://www.deepseek.com/
 */
import OpenAI from "openai";
import { sendSSE } from "@/utils/sse";
import { config } from "@/config";  // 根据你的路径调整
import * as logger from "@/utils/logger";
const openai = new OpenAI({
  apiKey: config.openaiKey || "",
  baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
});

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  name?: string;
}

interface Usage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
}

interface DeepseekOptions {
  res?: any;          // 如果传入 res 就做 SSE 流式
  stream?: boolean;   // 是否启用流式
}

interface DeepseekResponse {
  content: string;
  usage?: Usage | null;
}

/**
 * deepseekClient 支持两种模式：
 * 1. stream + res => SSE 流式返回
 * 2. 非流式 => 返回完整 content 和 usage
 */
export async function deepseekClient(
  messages: Message[],
  options: DeepseekOptions = {}
): Promise<DeepseekResponse | void> {
  const { res, stream = false } = options;

  let totalUsage: Usage | null = null;
  let fullContent = "";

  try {
    const responseStream = await openai.chat.completions.create({
      model: "deepseek-v3",
      messages,
      stream: stream,
      stream_options: { include_usage: true },
    });

    if (stream && res) {
      // -------------------- 流式 SSE --------------------
      console.log("\n" + "=".repeat(20) + "🧠 思考过程（SSE）" + "=".repeat(20) + "\n");

      // 检查返回值是否为异步可迭代对象（stream）
      const isAsyncIterable = responseStream && typeof (responseStream as any)[Symbol.asyncIterator] === "function";

      if (isAsyncIterable) {
        for await (const chunk of responseStream as AsyncIterable<any>) {
          const { choices = [], usage } = chunk;

          if (usage) totalUsage = usage;

          const content = choices[0]?.delta?.content ?? choices[0]?.text ?? choices[0]?.message?.content;
          if (content && content.trim() !== "") {
            process.stdout.write(content);
            sendSSE(res, { content });
          }
        }
      } else {
        // 如果 SDK 在某些情况下返回非流式的完整完成对象，作兼容处理
        const completion = responseStream as any;
        const { choices = [], usage } = completion || {};
        if (usage) totalUsage = usage;

        const content = choices[0]?.message?.content ?? choices[0]?.text ?? "";
        if (content && content.trim() !== "") {
          process.stdout.write(content);
          sendSSE(res, { content });
        }
      }

      // 流结束发送 token usage
      if (totalUsage) {
        console.log("\n📊 Token 使用情况:", totalUsage);
        sendSSE(res, {
          event: "usage",
          data: {
            prompt_tokens: totalUsage.prompt_tokens,
            completion_tokens: totalUsage.completion_tokens,
            total_tokens: totalUsage.total_tokens,
          },
        });
      }

      // // 最终返回 token 消耗给前端
      // sendSSE(res, {
      //   event: "end",
      //   data: { usage: totalUsage },
      // });

      res.end();

    } else {
      // -------------------- 非流式 --------------------
      console.log("\n" + "=".repeat(20) + "🧠 思考过程（非流式）" + "=".repeat(20) + "\n");

      const isAsyncIterable = responseStream && typeof (responseStream as any)[Symbol.asyncIterator] === "function";

      if (isAsyncIterable) {
        for await (const chunk of responseStream as AsyncIterable<any>) {
          const { choices = [], usage } = chunk;
          if (usage) totalUsage = usage;

          const content = choices[0]?.delta?.content ?? choices[0]?.text ?? choices[0]?.message?.content;
          if (content) {
            fullContent += content;
            process.stdout.write(content);
          }
        }
      } else {
        // 非流式返回的完整完成结果，直接读取一次
        const completion = responseStream as any;
        const { choices = [], usage } = completion || {};
        if (usage) totalUsage = usage;

        const contentPiece = choices
          .map((c: any) => c.message?.content ?? c.text ?? c.delta?.content ?? "")
          .join("");
        if (contentPiece) {
          fullContent += contentPiece;
          process.stdout.write(contentPiece);
        }
      }

      return {
        content: fullContent,
        usage: totalUsage,
      };
    }

  } catch (error) {
    console.error("Error in deepseekClient:", error);
    logger.error("deepseekClient error", { error });

    if (stream && res) {
      logger.streamLog(res, "服务器内部错误", "error");
      sendSSE(res, { error: "服务器内部错误" });
      res.end();
    } else {
      throw error;
    }
  }
}