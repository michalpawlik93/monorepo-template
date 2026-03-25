import { existsSync } from 'node:fs';
import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import type { LogLevel } from '../features/logging';

const LOG_LEVELS: LogLevel[] = ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'];

export const loadEnvironment = (appName: string, cwd = process.cwd()): string => {
  const environment = (process.env.NODE_ENV ?? 'development').toLowerCase();
  const envDirectory = path.resolve(cwd, 'apps', appName, 'config');
  const envFilePath = path.join(envDirectory, `env.${environment}`);

  if (existsSync(envFilePath)) {
    loadEnv({ path: envFilePath });
  } else {
    loadEnv();
  }

  return environment;
};

export const resolveLogLevel = (environment: string, value?: string | null): LogLevel => {
  if (!value) {
    return environment === 'production' ? 'info' : 'debug';
  }

  const normalized = value.toLowerCase() as LogLevel;
  if (LOG_LEVELS.includes(normalized)) {
    return normalized;
  }

  return environment === 'production' ? 'info' : 'debug';
};

export const resolveLogFilePath = (
  appName: string,
  value?: string | null,
  options?: { cwd?: string; logsDirectory?: string; allowAbsolute?: boolean },
): string => {
  const { cwd = process.cwd(), logsDirectory = 'logs', allowAbsolute = false } = options ?? {};

  if (!value) {
    return path.join(cwd, logsDirectory, `${appName}.log`);
  }

  if (allowAbsolute && path.isAbsolute(value)) {
    return value;
  }

  return path.join(cwd, value);
};

export const resolvePositiveInt = (value?: string | null): number | undefined => {
  const parsed = Number.parseInt(value ?? '', 10);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return undefined;
};
