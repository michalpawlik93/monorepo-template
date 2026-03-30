import Fastify from 'fastify';
import { registerErrorHandler } from '../errorHandler';

describe('errorHandler plugin', () => {
  it('returns 400 for validation errors', async () => {
    const app = Fastify();
    registerErrorHandler(app);
    app.get('/validation', async () => {
      const error = new Error('Invalid body') as Error & { validation: unknown };
      error.validation = [{ message: 'required' }];
      throw error;
    });

    const response = await app.inject({
      method: 'GET',
      url: '/validation',
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: {
        type: 'ValidationError',
        message: 'Invalid body',
      },
    });

    await app.close();
  });

  it('returns 429 for rate limit errors', async () => {
    const app = Fastify();
    registerErrorHandler(app);
    app.get('/rate-limit', async () => {
      const error = new Error('Too many requests') as Error & {
        code: string;
        statusCode: number;
      };
      error.code = 'FST_ERR_RATE_LIMIT';
      error.statusCode = 429;
      throw error;
    });

    const response = await app.inject({
      method: 'GET',
      url: '/rate-limit',
    });

    expect(response.statusCode).toBe(429);
    expect(response.json()).toEqual({
      error: {
        type: 'RateLimitError',
        message: 'Too many requests',
      },
    });

    await app.close();
  });

  it('returns 500 for generic errors', async () => {
    const app = Fastify();
    registerErrorHandler(app);
    app.get('/generic', async () => {
      throw new Error('Unexpected');
    });

    const response = await app.inject({
      method: 'GET',
      url: '/generic',
    });

    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({
      error: {
        type: 'SystemError',
        message: 'Internal Server Error',
      },
    });

    await app.close();
  });
});
