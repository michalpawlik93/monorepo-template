import type { Prisma } from './generated/prisma';

export interface PrismaModuleConfig {
  url: string;
}

export interface PrismaLogDefinition {
  level: 'query' | 'info' | 'warn' | 'error';
  emit: 'stdout' | 'event';
}

export interface PrismaClientOptions {
  datasources?: {
    db?: {
      url?: string;
    };
  };
  log?: Array<'query' | 'info' | 'warn' | 'error' | PrismaLogDefinition>;
}

const notConfiguredMessage = (schemaName: string) =>
  `Database url for schema "${schemaName}" is not configured. Set DATABASE_URL_${schemaName.toUpperCase()} or DATABASE_URL_BASE.`;

export const resolveDatabaseUrl = (
  moduleUrl: string | undefined,
  schemaName: string,
  baseUrl?: string,
): string => {
  const trimmedModuleUrl = moduleUrl?.trim();
  if (trimmedModuleUrl) {
    return trimmedModuleUrl;
  }

  const trimmedBaseUrl = baseUrl?.trim();
  if (trimmedBaseUrl) {
    const separator = trimmedBaseUrl.includes('?') ? '&' : '?';
    return `${trimmedBaseUrl}${separator}schema=${schemaName}`;
  }

  throw new Error(notConfiguredMessage(schemaName));
};

export const buildPrismaClientOptions = (
  config?: PrismaModuleConfig,
  log?: Prisma.LogDefinition[],
): PrismaClientOptions | undefined => {
  if (!config && !log) {
    return undefined;
  }

  const options: PrismaClientOptions = {};

  if (config?.url) {
    options.datasources = { db: { url: config.url } };
  }

  if (log) {
    options.log = log;
  }

  return options;
};

/**
 * Builds Prisma module configuration from environment variables
 * @param schemaName - Name of the schema (e.g., 'core', 'products')
 * @param envVarName - Optional custom environment variable name (defaults to DATABASE_URL_{SCHEMA_NAME})
 * @returns PrismaModuleConfig with the database URL
 */
export const buildPrismaModuleConfig = (
  schemaName: string,
  envVarName?: string,
): PrismaModuleConfig => {
  const varName = envVarName ?? `DATABASE_URL_${schemaName.toUpperCase()}`;
  const url = process.env[varName];

  if (!url) {
    throw new Error(notConfiguredMessage(schemaName));
  }

  return { url };
};

/**
 * Builds Prisma module configuration for core schema
 */
export const buildCorePrismaConfig = (): PrismaModuleConfig =>
  buildPrismaModuleConfig('core', 'DATABASE_URL_CORE');
