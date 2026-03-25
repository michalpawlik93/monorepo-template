import { LoggerFactory } from '../loggerFactory';
import { RequestContext } from '../requestContext';
import { LoggerConfig } from '../LoggerConfig';

const mockPinoLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  child: jest.fn((bindings) => ({ ...mockPinoLogger, bindings })),
};

jest.mock('pino', () => {
  const mockTransport = jest.fn(() => ({}));
  const mockPino = Object.assign(jest.fn(() => mockPinoLogger), {
    transport: mockTransport,
  });

  return {
    __esModule: true,
    default: mockPino,
    pino: mockPino,
  };
});

jest.mock('node:fs', () => ({
  existsSync: jest.fn(() => true),
  mkdirSync: jest.fn(),
}));

jest.mock('node:path', () => ({
  dirname: jest.fn((path: string) => path.split('/').slice(0, -1).join('/')),
}));

describe('LoggerFactory', () => {
  let requestContext: RequestContext;
  let config: LoggerConfig;
  let factory: LoggerFactory;

  beforeEach(() => {
    requestContext = new RequestContext();
    config = {
      level: 'info',
      filePath: '/tmp/test.log',
      prettyInDev: false,
    };
    factory = new LoggerFactory(requestContext, config);
  });

  describe('getBase', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('should return ILogger instance', () => {
      const logger = factory.getBase();

      expect(logger).toBeDefined();
      expect(typeof logger.debug).toBe('function');
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.child).toBe('function');
    });

    test('should allow calling debug method', () => {
      const logger = factory.getBase();
      logger.debug('test message');

      expect(mockPinoLogger.debug).toHaveBeenCalledWith('test message');
    });

    test('should allow calling info method', () => {
      const logger = factory.getBase();
      logger.info('test message');

      expect(mockPinoLogger.info).toHaveBeenCalledWith('test message');
    });

    test('should allow calling warn method', () => {
      const logger = factory.getBase();
      logger.warn('test message');

      expect(mockPinoLogger.warn).toHaveBeenCalledWith('test message');
    });

    test('should allow calling error method', () => {
      const logger = factory.getBase();
      logger.error('test message');

      expect(mockPinoLogger.error).toHaveBeenCalledWith('test message');
    });

    test('should allow calling debug with object and message', () => {
      const logger = factory.getBase();
      logger.debug({ key: 'value' }, 'test message');

      expect(mockPinoLogger.debug).toHaveBeenCalledWith({ key: 'value' }, 'test message');
    });

    test('should allow calling debug with only object', () => {
      const logger = factory.getBase();
      logger.debug({ key: 'value' });

      expect(mockPinoLogger.debug).toHaveBeenCalledWith({ key: 'value' });
    });

    test('should allow calling debug with undefined', () => {
      const logger = factory.getBase();
      logger.debug(undefined, 'test message');

      expect(mockPinoLogger.debug).toHaveBeenCalledWith('test message');
    });

    test('should handle info with object and message', () => {
      const logger = factory.getBase();
      logger.info({ data: 'test' }, 'info message');

      expect(mockPinoLogger.info).toHaveBeenCalledWith({ data: 'test' }, 'info message');
    });

    test('should handle warn with object and message', () => {
      const logger = factory.getBase();
      logger.warn({ warning: 'test' }, 'warning message');

      expect(mockPinoLogger.warn).toHaveBeenCalledWith({ warning: 'test' }, 'warning message');
    });

    test('should handle error with object and message', () => {
      const logger = factory.getBase();
      logger.error({ error: 'test' }, 'error message');

      expect(mockPinoLogger.error).toHaveBeenCalledWith({ error: 'test' }, 'error message');
    });

    test('should handle info with only object', () => {
      const logger = factory.getBase();
      logger.info({ data: 'test' });

      expect(mockPinoLogger.info).toHaveBeenCalledWith({ data: 'test' });
    });

    test('should handle warn with only object', () => {
      const logger = factory.getBase();
      logger.warn({ warning: 'test' });

      expect(mockPinoLogger.warn).toHaveBeenCalledWith({ warning: 'test' });
    });

    test('should handle error with only object', () => {
      const logger = factory.getBase();
      logger.error({ error: 'test' });

      expect(mockPinoLogger.error).toHaveBeenCalledWith({ error: 'test' });
    });

    test('should handle info with undefined and message', () => {
      const logger = factory.getBase();
      logger.info(undefined, 'info message');

      expect(mockPinoLogger.info).toHaveBeenCalledWith('info message');
    });

    test('should handle warn with undefined and message', () => {
      const logger = factory.getBase();
      logger.warn(undefined, 'warning message');

      expect(mockPinoLogger.warn).toHaveBeenCalledWith('warning message');
    });

    test('should handle error with undefined and message', () => {
      const logger = factory.getBase();
      logger.error(undefined, 'error message');

      expect(mockPinoLogger.error).toHaveBeenCalledWith('error message');
    });

    test('should allow creating child logger', () => {
      const logger = factory.getBase();
      const childBindings = { component: 'test' };
      mockPinoLogger.child.mockReturnValue(mockPinoLogger);
      
      const child = logger.child(childBindings);

      expect(mockPinoLogger.child).toHaveBeenCalledWith(childBindings);
      expect(child).toBeDefined();
    });
  });

  describe('forScope', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      mockPinoLogger.child.mockReturnValue(mockPinoLogger);
    });

    test('should return ILogger with scope binding', () => {
      const logger = factory.forScope('TEST_SCOPE');

      expect(logger).toBeDefined();
      expect(typeof logger.debug).toBe('function');
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');
    });

    test('should include request context data when available', () => {
      requestContext.run({ requestId: 'test-123', domain: 'test-domain' }, () => {
        const logger = factory.forScope('TEST_SCOPE');

        expect(mockPinoLogger.child).toHaveBeenCalledWith({
          scope: 'TEST_SCOPE',
          requestId: 'test-123',
          domain: 'test-domain',
        });
        expect(logger).toBeDefined();
      });
    });

    test('should work without request context', () => {
      const logger = factory.forScope('TEST_SCOPE');

      expect(mockPinoLogger.child).toHaveBeenCalledWith({
        scope: 'TEST_SCOPE',
        requestId: undefined,
        domain: undefined,
      });
      expect(logger).toBeDefined();
    });

    test('should include extra bindings', () => {
      const logger = factory.forScope('TEST_SCOPE', { component: 'test' });

      expect(mockPinoLogger.child).toHaveBeenCalledWith({
        scope: 'TEST_SCOPE',
        requestId: undefined,
        domain: undefined,
        component: 'test',
      });
      expect(logger).toBeDefined();
    });

    test('should combine scope, context and extra bindings', () => {
      requestContext.run({ requestId: 'test-456' }, () => {
        const logger = factory.forScope('TEST_SCOPE', { component: 'test' });

        expect(mockPinoLogger.child).toHaveBeenCalledWith({
          scope: 'TEST_SCOPE',
          requestId: 'test-456',
          domain: undefined,
          component: 'test',
        });
        expect(logger).toBeDefined();
      });
    });

    test('should handle request context with only requestId', () => {
      requestContext.run({ requestId: 'req-789' }, () => {
        const logger = factory.forScope('SCOPE', { extra: 'data' });

        expect(mockPinoLogger.child).toHaveBeenCalledWith({
          scope: 'SCOPE',
          requestId: 'req-789',
          domain: undefined,
          extra: 'data',
        });
        expect(logger).toBeDefined();
      });
    });

    test('should handle request context with only domain', () => {
      requestContext.run({ domain: 'example.com' }, () => {
        const logger = factory.forScope('SCOPE');

        expect(mockPinoLogger.child).toHaveBeenCalledWith({
          scope: 'SCOPE',
          requestId: undefined,
          domain: 'example.com',
        });
        expect(logger).toBeDefined();
      });
    });

    test('should allow creating child logger', () => {
      const logger = factory.forScope('TEST_SCOPE');
      const additionalBindings = { additional: 'binding' };
      mockPinoLogger.child.mockReturnValueOnce({ ...mockPinoLogger, additionalBindings });
      
      const child = logger.child(additionalBindings);

      expect(mockPinoLogger.child).toHaveBeenCalled();
      expect(child).toBeDefined();
      expect(typeof child.debug).toBe('function');
      expect(typeof child.info).toBe('function');
    });

    test('should handle empty extra bindings', () => {
      const logger = factory.forScope('SCOPE', {});

      expect(mockPinoLogger.child).toHaveBeenCalledWith({
        scope: 'SCOPE',
        requestId: undefined,
        domain: undefined,
      });
      expect(logger).toBeDefined();
    });

    test('should allow logging through forScope logger', () => {
      requestContext.run({ requestId: 'req-999' }, () => {
        const logger = factory.forScope('SCOPE');
        logger.debug('debug message');
        logger.info('info message');
        logger.warn('warn message');
        logger.error('error message');

        expect(mockPinoLogger.debug).toHaveBeenCalledWith('debug message');
        expect(mockPinoLogger.info).toHaveBeenCalledWith('info message');
        expect(mockPinoLogger.warn).toHaveBeenCalledWith('warn message');
        expect(mockPinoLogger.error).toHaveBeenCalledWith('error message');
      });
    });
  });

  describe('constructor', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('should create directory if it does not exist', () => {
      const fs = require('node:fs');
      fs.existsSync.mockReturnValue(false);

      const newFactory = new LoggerFactory(requestContext, config);

      expect(fs.mkdirSync).toHaveBeenCalled();
      expect(newFactory).toBeDefined();
    });

    test('should create directory with recursive option', () => {
      const fs = require('node:fs');
      fs.existsSync.mockReturnValue(false);

      const newFactory = new LoggerFactory(requestContext, config);

      expect(fs.mkdirSync).toHaveBeenCalledWith(expect.any(String), { recursive: true });
      expect(newFactory).toBeDefined();
    });

    test('should not create directory if it exists', () => {
      const fs = require('node:fs');
      fs.existsSync.mockReturnValue(true);

      const newFactory = new LoggerFactory(requestContext, config);

      expect(fs.mkdirSync).not.toHaveBeenCalled();
      expect(newFactory).toBeDefined();
    });

    test('should include pino-pretty transport when prettyInDev is true', () => {
      const pino = require('pino');
      const prettyConfig: LoggerConfig = {
        ...config,
        prettyInDev: true,
      };

      const newFactory = new LoggerFactory(requestContext, prettyConfig);

      expect(pino.default).toHaveBeenCalled();
      expect(newFactory).toBeDefined();
    });

    test('should use custom redact list when provided', () => {
      const pino = require('pino');
      const customConfig: LoggerConfig = {
        ...config,
        redact: ['custom', 'fields'],
      };

      const newFactory = new LoggerFactory(requestContext, customConfig);

      expect(pino.default).toHaveBeenCalledWith(
        expect.objectContaining({
          redact: ['custom', 'fields'],
        }),
        expect.anything()
      );
      expect(newFactory).toBeDefined();
    });

    test('should use default redact list when not provided', () => {
      const pino = require('pino');
      const newFactory = new LoggerFactory(requestContext, config);

      expect(pino.default).toHaveBeenCalledWith(
        expect.objectContaining({
          redact: ['password', 'headers.authorization', 'secret', 'token'],
        }),
        expect.anything()
      );
      expect(newFactory).toBeDefined();
    });

    test('should configure pino with correct level', () => {
      const pino = require('pino');
      const levelConfig: LoggerConfig = {
        ...config,
        level: 'debug',
      };

      const newFactory = new LoggerFactory(requestContext, levelConfig);

      expect(pino.default).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'debug',
        }),
        expect.anything()
      );
      expect(newFactory).toBeDefined();
    });

    test('should configure pino with formatters', () => {
      const pino = require('pino');
      const newFactory = new LoggerFactory(requestContext, config);

      const callArgs = pino.default.mock.calls[0][0];
      expect(callArgs.formatters).toBeDefined();
      expect(typeof callArgs.formatters.bindings).toBe('function');
      expect(typeof callArgs.formatters.level).toBe('function');
      expect(newFactory).toBeDefined();
    });

    test('should use pino.transport with file target', () => {
      const pino = require('pino');
      const newFactory = new LoggerFactory(requestContext, config);

      expect(pino.default).toHaveBeenCalled();
      expect(pino.pino.transport).toHaveBeenCalled();
      expect(newFactory).toBeDefined();
    });

    test('should handle different log levels', () => {
      const levels: Array<'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'silent'> = [
        'fatal',
        'error',
        'warn',
        'info',
        'debug',
        'trace',
        'silent',
      ];

      levels.forEach((level) => {
        const pino = require('pino');
        jest.clearAllMocks();
        
        const levelConfig: LoggerConfig = {
          ...config,
          level,
        };

        const newFactory = new LoggerFactory(requestContext, levelConfig);

        expect(pino.default).toHaveBeenCalledWith(
          expect.objectContaining({
            level,
          }),
          expect.anything()
        );
        expect(newFactory).toBeDefined();
      });
    });

    test('should handle empty redact array', () => {
      const pino = require('pino');
      const emptyRedactConfig: LoggerConfig = {
        ...config,
        redact: [],
      };

      const newFactory = new LoggerFactory(requestContext, emptyRedactConfig);

      expect(pino.default).toHaveBeenCalledWith(
        expect.objectContaining({
          redact: [],
        }),
        expect.anything()
      );
      expect(newFactory).toBeDefined();
    });
  });
});
