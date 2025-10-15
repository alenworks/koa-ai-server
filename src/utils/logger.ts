// utils/logger.ts
export const info = (message: string, meta?: any) => {
  console.log(`[INFO] ${new Date().toISOString()} - ${message}`, meta || "");
};

export const warn = (message: string, meta?: any) => {
  console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, meta || "");
};

export const error = (message: string, meta?: any) => {
  console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, meta || "");
};

import { sendSSE } from "@/utils/sse";

export const streamLog = (res: any, message: string, event?: string) => {
  if (res) {
    sendSSE(res, event ? { event, data: message } : { content: message });
  }
  info(message);
};

export const logRequest = (ctx: any) => {
  info(`HTTP ${ctx.method} ${ctx.url}`, { body: ctx.request.body });
};

export const logResponse = (ctx: any, status: number, data?: any) => {
  info(`HTTP ${ctx.method} ${ctx.url} -> ${status}`, data || "");
};

export const handleProcessErrors = () => {
  process.on("uncaughtException", (err) => {
    error("Uncaught Exception", { err });
    setTimeout(() => process.exit(1), 100).unref();
  });

  process.on("unhandledRejection", (reason, promise) => {
    error("Unhandled Rejection", { reason, promise });
  });
};