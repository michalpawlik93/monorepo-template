export interface ILogger {
  debug(objOrMsg: unknown, msg?: string): void;
  info(objOrMsg: unknown, msg?: string): void;
  warn(objOrMsg: unknown, msg?: string): void;
  error(objOrMsg: unknown, msg?: string): void;
  child(bindings: Record<string, unknown>): ILogger;
}

export type LogLevel = "fatal" | "error" | "warn" | "info" | "debug" | "trace" | "silent";
