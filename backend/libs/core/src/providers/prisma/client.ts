import { PrismaClient } from './generated/prisma';
import type { PrismaModuleConfig } from './config';
import { buildPrismaClientOptions } from './config';

export const createCorePrisma = (config?: PrismaModuleConfig): PrismaClient => {
  return new PrismaClient(buildPrismaClientOptions(config));
};
