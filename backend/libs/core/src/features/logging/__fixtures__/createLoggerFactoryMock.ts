import type { ILogger } from '../ILogger';
import type { LoggerFactory } from '../loggerFactory';

export interface LoggerFactoryMock {
  logger: jest.Mocked<ILogger>;
  factory: jest.Mocked<LoggerFactory>;
}

export interface LoggerFactoryMockOptions {
  logger?: jest.Mocked<ILogger>;
  scopedLoggerFactory?: (
    scope: string,
    extra: Record<string, unknown>,
  ) => jest.Mocked<ILogger>;
}

export const createLoggerMock = (): jest.Mocked<ILogger> => {
  const logger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    child: jest.fn(),
  } as unknown as jest.Mocked<ILogger>;

  logger.child.mockReturnValue(logger);

  return logger;
};

export const createLoggerFactoryMock = (
  options: LoggerFactoryMockOptions = {},
): LoggerFactoryMock => {
  const baseLogger =
    options.logger ??
    (() => {
      const mock = createLoggerMock();
      return mock;
    })();

  const scopedFactory =
    options.scopedLoggerFactory ??
    (() => baseLogger);

  const factory = {
    getBase: jest.fn(() => baseLogger),
    forScope: jest.fn(
      (scope: string, extra: Record<string, unknown> = {}) =>
        scopedFactory(scope, extra),
    ),
  } as unknown as jest.Mocked<LoggerFactory>;

  return {
    logger: baseLogger,
    factory,
  };
};
