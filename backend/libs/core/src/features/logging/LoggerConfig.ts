import type { LogLevel } from "./ILogger";

export interface LoggerConfig {
  level: LogLevel;
  filePath: string;
  prettyInDev?: boolean;
  redact?: string[];
}
