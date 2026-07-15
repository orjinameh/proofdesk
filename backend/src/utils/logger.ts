/**
 * Minimal structured logger. Kept dependency-free on purpose so the
 * MVP doesn't drag in a heavy logging stack for a hackathon build.
 */
type LogLevel = "info" | "warn" | "error" | "debug";

function emit(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
  const entry = {
    ts: new Date().toISOString(),
    level,
    message,
    ...(meta ? { meta } : {}),
  };
  const line = JSON.stringify(entry);
  if (level === "error") {
    // eslint-disable-next-line no-console
    console.error(line);
  } else if (level === "warn") {
    // eslint-disable-next-line no-console
    console.warn(line);
  } else {
    // eslint-disable-next-line no-console
    console.log(line);
  }
}

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => emit("info", message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => emit("warn", message, meta),
  error: (message: string, meta?: Record<string, unknown>) => emit("error", message, meta),
  debug: (message: string, meta?: Record<string, unknown>) => emit("debug", message, meta),
};
