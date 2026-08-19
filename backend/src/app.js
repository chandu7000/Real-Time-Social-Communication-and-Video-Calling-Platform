import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import chatRoutes from "./routes/chat.route.js";
import videoRoutes from "./routes/video.route.js";
import notificationRoutes from "./routes/notification.route.js";
import { env, isProduction } from "./config/env.js";
import { errorHandler, notFound } from "./middleware/error.middleware.js";
import { createCorsOptions, securityHeaders } from "./middleware/security.middleware.js";

const app = express();

app.disable("x-powered-by");

app.use(securityHeaders);
app.use(cors(createCorsOptions(env)));

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
  res.status(200).json({ success: true, status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/video", videoRoutes);
app.use("/api/notifications", notificationRoutes);

if (isProduction) {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const frontendDistPath = path.resolve(currentDir, "../../frontend/dist");

  app.use(express.static(frontendDistPath));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) {
      return next();
    }

    return res.sendFile(path.join(frontendDistPath, "index.html"));
  });
}

app.use(notFound);
app.use(errorHandler);

export default app;
