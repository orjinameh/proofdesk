import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";

import { config, logStartupBanner } from "./config/env";
import { connectDatabase } from "./config/database";
import { logger } from "./utils/logger";
import verifyRoutes from "./routes/verify";
import mcpRoutes from "./mcp/mcpRoutes";

const app = express();

app.use(helmet());
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json({ limit: "256kb" }));
app.use(
  morgan("combined", {
    stream: { write: (message: string) => logger.info(message.trim()) },
  })
);

// Health check - used by Render and by agents doing liveness checks
// before relying on ProofDesk.
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    provider: "ProofDesk",
    mode: config.flags.mockMode ? "mock" : "live",
    persistence: config.flags.persistenceEnabled,
  });
});

app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    provider: "ProofDesk",
    description:
      "Trust verification service for autonomous AI agents. See /api/v1/verify and /mcp/tools.",
    endpoints: {
      verify: "POST /api/v1/verify",
      mcp_tools: "GET /mcp/tools",
      mcp_invoke: "POST /mcp/invoke",
      health: "GET /health",
    },
  });
});

app.use("/api/v1", verifyRoutes);
app.use("/mcp", mcpRoutes);

// ASP discovery manifest - served at both a conventional root path and
// the .well-known convention, so OKX.AI's A2MCP registry (or any agent)
// can discover ProofDesk's tools without prior integration work.
const manifestPath = path.join(__dirname, "..", "asp-manifest.json");
app.get(["/asp-manifest.json", "/.well-known/asp-manifest.json"], (_req: Request, res: Response) => {
  res.status(200).sendFile(manifestPath);
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ provider: "ProofDesk", error: "not_found" });
});

// Centralized error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error("Unhandled error", { error: err.message });
  res.status(500).json({ provider: "ProofDesk", error: "internal_error" });
});

async function start(): Promise<void> {
  logStartupBanner();
  await connectDatabase();

  app.listen(config.port, () => {
    logger.info(`ProofDesk API listening on port ${config.port}`);
  });
}

start().catch((err) => {
  logger.error("Fatal startup error", { error: err instanceof Error ? err.message : String(err) });
  process.exit(1);
});
