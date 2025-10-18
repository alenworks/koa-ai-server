import OpenAI from "openai";
import { sendSSE } from "@/utils/sse";
import { config } from "@/config";  
import * as logger from '../middlewares/logger';

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
  res?: any;
  stream?: boolean;
}

interface DeepseekResponse {
  content: string;
  usage?: Usage | null;
}

// -------------------- API Key 管理器 --------------------
class ApiKeyManager {
  private keys: string[];
  private currentIndex = 0;

  constructor(keys: string[]) {
    if (!keys.length) throw new Error("No API keys provided");
    this.keys = keys;
  }

  getCurrentKey() {
    return this.keys[this.currentIndex];
  }

  switchKey(reason?: string) {
    const failedKey = this.keys[this.currentIndex];
    console.warn(`❌ API Key ${failedKey.slice(0, 10)}... 失效: ${reason || '未知原因'}`);
    this.currentIndex = (this.currentIndex + 1) % this.keys.length;
    console.log(`⚙️ 切换到备用 API Key: ${this.keys[this.currentIndex].slice(0, 10)}...`);
  }
}

// 初始化 KeyManager
const apiKeyManager = new ApiKeyManager([config.openaiKeys]);

// -------------------- deepseekClient --------------------
export async function deepseekClient(
  messages: Message[],
  options: DeepseekOptions = {}
): Promise<DeepseekResponse | void> {
  const { res, stream = false } = options;
  let totalUsage: Usage | null = null;
  let fullContent = "";

  async function callOpenAI(): Promise<any> {
    const key = apiKeyManager.getCurrentKey();
    const openai = new OpenAI({
      apiKey: key,
      baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    });

    return openai.chat.completions.create({
      model: "deepseek-v3",
      messages,
      stream: stream,
      stream_options: { include_usage: true },
    });
  }

  try {
    const responseStream = await callOpenAI();

    if (stream && res) {
      const isAsyncIterable = responseStream && typeof (responseStream as any)[Symbol.asyncIterator] === "function";

      if (isAsyncIterable) {
        for await (const chunk of responseStream as AsyncIterable<any>) {
          const { choices = [], usage } = chunk;
          if (usage) totalUsage = usage;
          const content = choices[0]?.delta?.content ?? choices[0]?.text ?? choices[0]?.message?.content;
          if (content?.trim()) {
            fullContent += content;
            process.stdout.write(content);
            sendSSE(res, { process: "message", content });
          }
        }
      } else {
        const completion = responseStream as any;
        const { choices = [], usage } = completion || {};
        if (usage) totalUsage = usage;
        const content = choices[0]?.message?.content ?? choices[0]?.text ?? "";
        if (content?.trim()) {
          fullContent += content;
          process.stdout.write(content);
          sendSSE(res, { process: "message", content });
        }
      }

      if (totalUsage) {
        sendSSE(res, {
          process: "usage",
          data: {
            prompt_tokens: totalUsage.prompt_tokens,
            completion_tokens: totalUsage.completion_tokens,
            total_tokens: totalUsage.total_tokens,
            model: "deepseek-v3",
          },
        }, 'usage');
      }

      sendSSE(res, { process: "done", content: fullContent }, "done");
      res.end();
    } else {
      const isAsyncIterable = responseStream && typeof (responseStream as any)[Symbol.asyncIterator] === "function";

      if (isAsyncIterable) {
        for await (const chunk of responseStream as AsyncIterable<any>) {
          const { choices = [], usage } = chunk;
          if (usage) totalUsage = usage;
          fullContent += choices[0]?.delta?.content ?? choices[0]?.text ?? choices[0]?.message?.content ?? "";
        }
      } else {
        const completion = responseStream as any;
        const { choices = [], usage } = completion || {};
        if (usage) totalUsage = usage;
        fullContent = choices.map((c: any) => c.message?.content ?? c.text ?? c.delta?.content ?? "").join("");
      }

      return { content: fullContent, usage: totalUsage };
    }
  } catch (err: any) {
    const message = err?.message || "";
    logger.error("deepseekClient error", { error: err });

    // 识别 API Key 相关错误，自动切换并重试一次
    if (
      message.includes("401") ||
      message.includes("invalid_api_key") ||
      message.includes("rate limit") ||
      message.includes("429")
    ) {
      apiKeyManager.switchKey(message);
      console.log("⚡ 正在使用备用 Key 重试...");
      return deepseekClient(messages, options); // 递归重试
    }

    if (stream && res) {
      logger.streamLog(res, "服务器内部错误", "error");
      sendSSE(res, { process: "error", content: "服务器内部错误" }, "error");
      res.end();
    } else {
      throw err;
    }
  }
}
