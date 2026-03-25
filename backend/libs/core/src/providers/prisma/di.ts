import { Container } from 'inversify';
import { bindOrRebind } from '../../utils/inversify';
import { createCorePrisma } from './client';
import { setCorePrismaClient } from './tx';
import type { PrismaModuleConfig } from './config';
import { PrismaClient } from './generated/prisma';

type PrismaClientLike = {
  $disconnect(): Promise<void>;
};

export const registerPrismaSingleton = (
  container: Container,
  token: symbol,
  config?: PrismaModuleConfig,
): PrismaClient => {
  const client = createCorePrisma(config);

  bindOrRebind(container, token, () => {
    container.bind<PrismaClient>(token).toConstantValue(client);
  });

  setCorePrismaClient(client);

  return client;
};

export const disconnectPrismaClient = async <T extends PrismaClientLike>(
  container: Container,
  token: symbol,
): Promise<void> => {
  if (!container.isBound(token)) {
    return;
  }

  const client = container.get<T>(token);
  await client.$disconnect();
};
