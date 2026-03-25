import { PrismaModuleConfig, buildPrismaClientOptions } from '@app/core/prisma';
import { PrismaClient } from './generated/prisma';

export const createProductsPrisma = (
  config?: PrismaModuleConfig,
): PrismaClient => {
  return new PrismaClient(buildPrismaClientOptions(config));
};
