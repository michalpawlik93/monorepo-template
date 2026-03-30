import { IN_MEMORY_TRANSPORT } from '@app/core';
import type { IIdentityFacade } from '@app/integration-contracts';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type {
  LoginBodyType,
  RefreshTokenBodyType,
  RegisterBodyType,
} from '../schemas/identity.schema';
import '../types';
import { mapResultToReply } from '../utils/resultMapper';

const unauthorized = (reply: FastifyReply, message: string) =>
  reply.code(401).send({
    error: {
      type: 'UnauthorizedError',
      message,
    },
  });

export const registerController =
  (identityFacade: IIdentityFacade) =>
  async (
    request: FastifyRequest<{ Body: RegisterBodyType }>,
    reply: FastifyReply,
  ) => {
    const result = await identityFacade.register(request.body, {
      via: IN_MEMORY_TRANSPORT,
    });
    return mapResultToReply(result, reply);
  };

export const loginController =
  (identityFacade: IIdentityFacade) =>
  async (
    request: FastifyRequest<{ Body: LoginBodyType }>,
    reply: FastifyReply,
  ) => {
    const result = await identityFacade.login(request.body, {
      via: IN_MEMORY_TRANSPORT,
    });
    return mapResultToReply(result, reply);
  };

export const logoutController =
  (identityFacade: IIdentityFacade) =>
  async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.principal?.userId;
    if (!userId) {
      return unauthorized(reply, 'Authenticated user is required.');
    }

    const result = await identityFacade.logout(
      { userId },
      { via: IN_MEMORY_TRANSPORT },
    );
    return mapResultToReply(result, reply);
  };

export const refreshTokenController =
  (identityFacade: IIdentityFacade) =>
  async (
    request: FastifyRequest<{ Body: RefreshTokenBodyType }>,
    reply: FastifyReply,
  ) => {
    const result = await identityFacade.refreshToken(request.body, {
      via: IN_MEMORY_TRANSPORT,
    });
    return mapResultToReply(result, reply);
  };

export const getCurrentUserController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  if (!request.principal) {
    return unauthorized(reply, 'Authenticated user is required.');
  }

  return reply.code(200).send({ data: request.principal });
};

export const getUserProfileController =
  (identityFacade: IIdentityFacade) =>
  async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.principal?.userId;
    if (!userId) {
      return unauthorized(reply, 'Authenticated user is required.');
    }

    const result = await identityFacade.getUserProfile(userId, {
      via: IN_MEMORY_TRANSPORT,
    });
    return mapResultToReply(result, reply);
  };
