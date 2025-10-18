// middlewares/rateLimitRedis.ts
import type { Context, Next } from "koa";
import Redis from "ioredis";

const isDev = process.env.NODE_ENV === "development";

// ✅ 内存版限流（开发模式用）
const memoryCache = new Map<string, { count: number; lastReset: number }>();
const WINDOW_SIZE = 60; // 秒
const MAX_REQUESTS = 4;

// ✅ Redis 连接（测试 / 生产使用）
let redis: Redis | null = null;

if (!isDev) {
  redis = new Redis(process.env.REDIS_URL  || "redis://localhost:6379", {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });

  redis.on("connect", () => console.log("✅ Redis 已连接"));
  redis.on("error", (err) => console.error("❌ Redis 连接错误:", err.message));
}

/**
 * 通用 Rate Limit 中间件
 * dev 模式用内存
 * prod/staging 模式用 Redis
 */
export async function rateLimitRedis(ctx: Context, next: Next) {
  const userId = ctx.state.user?.id || ctx.ip;
  const key = `rate_limit:${userId}`;

  // -------------------- 开发模式 (使用内存限流) --------------------
  if (isDev) {
    const now = Date.now();
    const record = memoryCache.get(userId) || { count: 0, lastReset: now };

    if (now - record.lastReset > WINDOW_SIZE * 1000) {
      record.count = 0;
      record.lastReset = now;
    }

    record.count += 1;
    memoryCache.set(userId, record);
    console.log(`🛡️ [RateLimit] ${userId} 在窗口期内的请求数: ${record.count}`);
    if (record.count > MAX_REQUESTS) {
      ctx.status = 429;
      ctx.body = { code: 429, message: "请求过于频繁（开发环境）" };
      return;
    }

    return next();
  }

  // -------------------- 生产/测试模式 (使用 Redis) --------------------
  if (!redis) {
    console.error("⚠️ Redis 未初始化，限流功能失效");
    return next();
  }

  const current = await redis.incr(key);
  if (current === 1) {
    await redis.expire(key, WINDOW_SIZE);
  }

  if (current > MAX_REQUESTS) {
    ctx.status = 429;
    ctx.body = { code: 429, message: "请求过于频繁，请稍后再试。" };
    return;
  }

  await next();
}
