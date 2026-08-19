import app from "./app.js";
import { env, validateEnvironment } from "./config/env.js";
import { connectDB } from "./lib/db.js";
import { logger } from "./utils/logger.js";

export const startServer = async () => {
  validateEnvironment();
  await connectDB();

  return app.listen(env.port, () => {
    logger.info(`Server is running on port ${env.port}`);
  });
};

startServer().catch((error) => {
  logger.error("Failed to start server", error);
  process.exitCode = 1;
});
