import {
  type LoggerConfig,
  loadEnvironment,
  resolveLogLevel as resolveLogLevelValue,
  resolveLogFilePath,
} from '@app/core';

const environment = loadEnvironment('app-console');

export const resolveLogLevel = (value?: string | null) => resolveLogLevelValue(environment, value);

const LOGS_DIRECTORY = 'logs/app-console';

const buildModuleLoggerConfig = (
  moduleName: string,
  filePath?: string | null,
): LoggerConfig => ({
  level: resolveLogLevelValue(environment, process.env.LOG_LEVEL),
  filePath: resolveLogFilePath(moduleName, filePath, {
    allowAbsolute: true,
    logsDirectory: LOGS_DIRECTORY,
  }),
  prettyInDev: environment !== 'production',
});

export const buildProductsLoggerConfig = (): LoggerConfig =>
  buildModuleLoggerConfig('products', process.env.PRODUCTS_LOG_FILE_PATH);

export const buildCoreLoggerConfig = (): LoggerConfig =>
  buildModuleLoggerConfig('core', process.env.CORE_LOG_FILE_PATH ?? process.env.LOG_FILE_PATH);

export const getEnvironment = (): string => environment;
