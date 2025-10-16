// middlewares/errorHandler.ts
export const errorHandler = async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    console.error("❌ Koa Error:", err);
    ctx.status = err.status || 500;
    ctx.body = {
      success: false,
      message: err.message || "服务器内部错误",
    };
    // 可选：将错误上报到日志服务
  }
};
