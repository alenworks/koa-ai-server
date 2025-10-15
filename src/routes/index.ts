import Router from "koa-router";
import aiRouter from "./ai";
import test from './test'
const router = new Router({ prefix: "/api" });

router.use(aiRouter.routes());
router.use(test.routes());

export default router;
