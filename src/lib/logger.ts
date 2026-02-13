type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  service?: string;
  requestId?: string;
  duration?: number;
  status?: number;
  [key: string]: unknown;
}

function log(entry: LogEntry) {
  const timestamp = new Date().toISOString();
  const line = { timestamp, ...entry };
  if (entry.level === "error") {
    console.error(JSON.stringify(line));
  } else {
    console.log(JSON.stringify(line));
  }
}

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) => log({ level: "debug", message, ...meta }),
  info: (message: string, meta?: Record<string, unknown>) => log({ level: "info", message, ...meta }),
  warn: (message: string, meta?: Record<string, unknown>) => log({ level: "warn", message, ...meta }),
  error: (message: string, meta?: Record<string, unknown>) => log({ level: "error", message, ...meta }),
};
