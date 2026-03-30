import { IN_MEMORY_TRANSPORT, ok } from '@app/core';
import type { FastifyRequest } from 'fastify';
import {
  mockLoginResponse,
  mockPrincipal,
  mockSession,
} from '../../__fixtures__/dtos/identity';
import { createIdentityFacadeMock } from '../../__fixtures__/identityFacadeMock';
import { createReplyMock } from '../../__fixtures__/replyMock';
import {
  getCurrentUserController,
  getUserProfileController,
  loginController,
  logoutController,
  refreshTokenController,
  registerController,
} from '../identity.controller';
import '../../types';

describe('identity.controller', () => {
  it('registerController returns 200 on success', async () => {
    const identityFacade = createIdentityFacadeMock();
    identityFacade.register?.mockResolvedValue(
      ok({ userId: 'u1', email: 'john@example.com' }),
    );
    const controller = registerController(identityFacade as never);
    const request = {
      body: { email: 'john@example.com', password: 'secret123' },
    } as unknown as FastifyRequest;
    const reply = createReplyMock();

    await controller(request as never, reply as never);

    expect(identityFacade.register).toHaveBeenCalledWith(request.body, {
      via: IN_MEMORY_TRANSPORT,
    });
    expect(reply.code).toHaveBeenCalledWith(200);
    expect(reply.send).toHaveBeenCalledWith({
      data: { userId: 'u1', email: 'john@example.com' },
    });
  });

  it('loginController returns 200 on success', async () => {
    const identityFacade = createIdentityFacadeMock();
    identityFacade.login?.mockResolvedValue(ok(mockLoginResponse()));
    const controller = loginController(identityFacade as never);
    const request = {
      body: { email: 'john@example.com', password: 'secret123' },
    } as unknown as FastifyRequest;
    const reply = createReplyMock();

    await controller(request as never, reply as never);

    expect(identityFacade.login).toHaveBeenCalledWith(request.body, {
      via: IN_MEMORY_TRANSPORT,
    });
    expect(reply.code).toHaveBeenCalledWith(200);
    expect(reply.send).toHaveBeenCalledWith({
      data: mockLoginResponse(),
    });
  });

  it('logoutController returns 200 on success', async () => {
    const identityFacade = createIdentityFacadeMock();
    identityFacade.logout?.mockResolvedValue(ok(null));
    const controller = logoutController(identityFacade as never);
    const request = {
      principal: mockPrincipal({ userId: 'u1' }),
    } as unknown as FastifyRequest;
    const reply = createReplyMock();

    await controller(request as never, reply as never);

    expect(identityFacade.logout).toHaveBeenCalledWith(
      { userId: 'u1' },
      { via: IN_MEMORY_TRANSPORT },
    );
    expect(reply.code).toHaveBeenCalledWith(200);
    expect(reply.send).toHaveBeenCalledWith({ data: null });
  });

  it('logoutController returns 401 when userId is missing', async () => {
    const identityFacade = createIdentityFacadeMock();
    const controller = logoutController(identityFacade as never);
    const request = {} as FastifyRequest;
    const reply = createReplyMock();

    await controller(request as never, reply as never);

    expect(identityFacade.logout).not.toHaveBeenCalled();
    expect(reply.code).toHaveBeenCalledWith(401);
    expect(reply.send).toHaveBeenCalledWith({
      error: {
        type: 'UnauthorizedError',
        message: 'Authenticated user is required.',
      },
    });
  });

  it('refreshTokenController returns 200 on success', async () => {
    const identityFacade = createIdentityFacadeMock();
    identityFacade.refreshToken?.mockResolvedValue(
      ok({ session: mockSession() }),
    );
    const controller = refreshTokenController(identityFacade as never);
    const request = {
      body: { refreshToken: 'refresh-token-1' },
    } as unknown as FastifyRequest;
    const reply = createReplyMock();

    await controller(request as never, reply as never);

    expect(identityFacade.refreshToken).toHaveBeenCalledWith(request.body, {
      via: IN_MEMORY_TRANSPORT,
    });
    expect(reply.code).toHaveBeenCalledWith(200);
    expect(reply.send).toHaveBeenCalledWith({
      data: { session: mockSession() },
    });
  });

  it('getCurrentUserController returns 200 with principal', async () => {
    const request = {
      principal: mockPrincipal(),
    } as unknown as FastifyRequest;
    const reply = createReplyMock();

    await getCurrentUserController(request as never, reply as never);

    expect(reply.code).toHaveBeenCalledWith(200);
    expect(reply.send).toHaveBeenCalledWith({ data: mockPrincipal() });
  });

  it('getCurrentUserController returns 401 when principal is missing', async () => {
    const request = {} as FastifyRequest;
    const reply = createReplyMock();

    await getCurrentUserController(request as never, reply as never);

    expect(reply.code).toHaveBeenCalledWith(401);
    expect(reply.send).toHaveBeenCalledWith({
      error: {
        type: 'UnauthorizedError',
        message: 'Authenticated user is required.',
      },
    });
  });

  it('getUserProfileController returns 200 on success', async () => {
    const identityFacade = createIdentityFacadeMock();
    const userProfile = {
      id: 'u1',
      email: 'john@example.com',
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      lastLoginAt: new Date('2024-01-02T00:00:00.000Z'),
    };
    identityFacade.getUserProfile?.mockResolvedValue(ok(userProfile));
    const controller = getUserProfileController(identityFacade as never);
    const request = {
      principal: mockPrincipal({ userId: 'u1' }),
    } as unknown as FastifyRequest;
    const reply = createReplyMock();

    await controller(request as never, reply as never);

    expect(identityFacade.getUserProfile).toHaveBeenCalledWith('u1', {
      via: IN_MEMORY_TRANSPORT,
    });
    expect(reply.code).toHaveBeenCalledWith(200);
    expect(reply.send).toHaveBeenCalledWith({ data: userProfile });
  });
});
