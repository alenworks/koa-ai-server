import cors from "@koa/cors";
import helmet from "koa-helmet";

export const useSecurity = () => {
  return async (ctx, next) => {
    await helmet()(ctx, async () => {
      await cors({ origin: "*" })(ctx, next);
    });
  };
};
