import app from "./app";
import { config } from "./config";
import * as logger from "@/utils/logger";

const port = config.port;

app.listen(port, () => {
  logger.info(`🚀 Koa server is running at http://localhost:${port}`);
});
