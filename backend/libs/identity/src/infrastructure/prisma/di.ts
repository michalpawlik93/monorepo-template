import { Container } from 'inversify';
import { bindOrRebind } from '@app/core';
import { PrismaModuleConfig } from '@app/core/prisma';
import { PrismaClient } from './generated/prisma';
import { createIdentityPrisma } from './client';
import { setIdentityPrismaClient } from './tx';
import {
  IUserProfileRepository,
  IPermissionRepository,
  IRoleRepository,
  IUserRoleRepository,
  PERMISSION_REPOSITORY_KEY,
  ROLE_REPOSITORY_KEY,
  USER_PROFILE_REPOSITORY_KEY,
  USER_ROLE_REPOSITORY_KEY,
} from '../../domain';
import { UserProfileRepository } from './userProfile.repository';
import { RoleRepository } from './role.repository';
import { PermissionRepository } from './permission.repository';
import { UserRoleRepository } from './userRole.repository';

export const IDENTITY_TOKENS = {
  PRISMA_CONFIG: Symbol.for('IdentityPrismaConfig'),
  PRISMA_CLIENT: Symbol.for('IdentityPrismaClient'),
};

export const registerIdentityPrisma = (
  container: Container,
  config?: PrismaModuleConfig,
): PrismaClient => {
  const client = createIdentityPrisma(config);

  bindOrRebind(container, IDENTITY_TOKENS.PRISMA_CONFIG, () => {
    container
      .bind<PrismaModuleConfig | undefined>(IDENTITY_TOKENS.PRISMA_CONFIG)
      .toConstantValue(config);
  });

  bindOrRebind(container, IDENTITY_TOKENS.PRISMA_CLIENT, () => {
    container.bind<PrismaClient>(IDENTITY_TOKENS.PRISMA_CLIENT).toConstantValue(client);
  });

  setIdentityPrismaClient(client);

  return client;
};

export const registerIdentityRepository = (container: Container): void => {
  bindOrRebind(container, USER_PROFILE_REPOSITORY_KEY, () => {
    container
      .bind<IUserProfileRepository>(USER_PROFILE_REPOSITORY_KEY)
      .to(UserProfileRepository)
      .inSingletonScope();
  });

  bindOrRebind(container, ROLE_REPOSITORY_KEY, () => {
    container.bind<IRoleRepository>(ROLE_REPOSITORY_KEY).to(RoleRepository).inSingletonScope();
  });

  bindOrRebind(container, PERMISSION_REPOSITORY_KEY, () => {
    container
      .bind<IPermissionRepository>(PERMISSION_REPOSITORY_KEY)
      .to(PermissionRepository)
      .inSingletonScope();
  });

  bindOrRebind(container, USER_ROLE_REPOSITORY_KEY, () => {
    container
      .bind<IUserRoleRepository>(USER_ROLE_REPOSITORY_KEY)
      .to(UserRoleRepository)
      .inSingletonScope();
  });
};
