import mongoose from "mongoose";
import { config } from "./env";
import { logger } from "../utils/logger";

export async function connectDatabase(): Promise<void> {
  if (!config.mongoUri) {
    logger.info("MONGODB_URI not set - running without persistence (in-memory only).");
    return;
  }

  try {
    await mongoose.connect(config.mongoUri);
    logger.info("Connected to MongoDB.");
  } catch (err) {
    logger.error("Failed to connect to MongoDB. Continuing without persistence.", {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
