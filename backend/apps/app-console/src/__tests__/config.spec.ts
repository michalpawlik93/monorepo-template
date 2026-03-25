import path from 'node:path';

type EnvOverrides = Partial<NodeJS.ProcessEnv>;

const withConfigModule = (
  env: EnvOverrides,
  run: (mod: typeof import('../config')) => void,
) => {
  const originalEnv = process.env;
  process.env = { ...originalEnv, ...env };
  jest.resetModules();
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const moduleExports = require('../config') as typeof import('../config');
  try {
    run(moduleExports);
  } finally {
    process.env = originalEnv;
    jest.resetModules();
  }
};

describe('app-console config', () => {
  it('fall backs to debug log level in development when value is invalid', () => {
    withConfigModule({ NODE_ENV: 'development' }, ({ resolveLogLevel }) => {
      expect(resolveLogLevel('verbose')).toBe('debug');
    });
  });

  it('returns info log level as default for production when value missing', () => {
    withConfigModule({ NODE_ENV: 'production' }, ({ resolveLogLevel }) => {
      expect(resolveLogLevel(undefined)).toBe('info');
    });
  });
});
