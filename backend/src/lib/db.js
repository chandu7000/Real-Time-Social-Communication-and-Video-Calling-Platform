import mongoose from "mongoose";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

export const connectDB = async () => {
  if (!env.mongoUri) {
    throw new Error("MONGO_URI is not configured");
  }

  const connection = await mongoose.connect(env.mongoUri);
  logger.info(`MongoDB connected: ${connection.connection.host}`);
  return connection;
};
