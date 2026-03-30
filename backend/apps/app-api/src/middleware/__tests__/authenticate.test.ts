import { err, ok } from '@app/core';
import type { IIdentityFacade } from '@app/integration-contracts';
import type { FastifyRequest } from 'fastify';
import { createReplyMock } from '../../__fixtures__/replyMock';
import { createAuthenticate } from '../authenticate';
import '../../types';

describe('authenticate middleware', () => {
  it('stores principal when token is valid', async () => {
    const identityFacade: Pick<IIdentityFacade, 'getCurrentUser'> = {
      getCurrentUser: jest.fn().mockResolvedValue(
        ok({
          userId: 'u1',
          email: 'john@example.com',
          roles: ['user'],
          permissions: ['products.read'],
        }),
      ),
    };
    const middleware = createAuthenticate(identityFacade as IIdentityFacade);
    const request = {
      headers: {
        authorization: 'Bearer token-123',
      },
    } as unknown as FastifyRequest;
    const reply = createReplyMock();

    await middleware(request, reply as never);

    expect(identityFacade.getCurrentUser).toHaveBeenCalled();
    expect(request.principal).toEqual({
      userId: 'u1',
      email: 'john@example.com',
      roles: ['user'],
      permissions: ['products.read'],
    });
  });

  it('returns 401 when token is missing', async () => {
    const identityFacade: Pick<IIdentityFacade, 'getCurrentUser'> = {
      getCurrentUser: jest.fn(),
    };
    const middleware = createAuthenticate(identityFacade as IIdentityFacade);
    const request = { headers: {} } as unknown as FastifyRequest;
    const reply = createReplyMock();

    await middleware(request, reply as never);

    expect(reply.code).toHaveBeenCalledWith(401);
    expect(reply.send).toHaveBeenCalledWith({
      error: {
        type: 'UnauthorizedError',
        message: 'Bearer token is required.',
      },
    });
    expect(identityFacade.getCurrentUser).not.toHaveBeenCalled();
  });

  it('returns 401 when facade returns error', async () => {
    const identityFacade: Pick<IIdentityFacade, 'getCurrentUser'> = {
      getCurrentUser: jest
        .fn()
        .mockResolvedValue(err({ _type: 'UnauthorizedError', message: 'nope' })),
    };
    const middleware = createAuthenticate(identityFacade as IIdentityFacade);
    const request = {
      headers: { authorization: 'Bearer token-123' },
    } as unknown as FastifyRequest;
    const reply = createReplyMock();

    await middleware(request, reply as never);

    expect(reply.code).toHaveBeenCalledWith(401);
    expect(reply.send).toHaveBeenCalledWith({
      error: { type: 'UnauthorizedError', message: 'nope' },
    });
  });
});
