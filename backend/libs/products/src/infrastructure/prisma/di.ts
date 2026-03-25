import { Container } from 'inversify';
import { PrismaClient } from './generated/prisma';
import { PrismaModuleConfig } from '@app/core/prisma';
import { bindOrRebind } from '@app/core';
import { createProductsPrisma } from './client';
import { setProductsPrismaClient } from './tx';
import { IProductsRepository, PRODUCTS_REPOSITORY_KEY, ProductsRepository } from './products.repository';

export const PRODUCTS_TOKENS = {
  PRISMA_CONFIG: Symbol.for('ProductsPrismaConfig'),
  PRISMA_CLIENT: Symbol.for('ProductsPrismaClient'),
};

export const registerProductsPrisma = (
  container: Container,
  config?: PrismaModuleConfig,
): PrismaClient => {
  const client = createProductsPrisma(config);

  bindOrRebind(container, PRODUCTS_TOKENS.PRISMA_CONFIG, () => {
    container.bind<PrismaModuleConfig>(PRODUCTS_TOKENS.PRISMA_CONFIG).toConstantValue(config);
  });

  bindOrRebind(container, PRODUCTS_TOKENS.PRISMA_CLIENT, () => {
    container.bind<PrismaClient>(PRODUCTS_TOKENS.PRISMA_CLIENT).toConstantValue(client);
  });

  setProductsPrismaClient(client);

  return client;
};

export const registerProductsRepository = (container: Container): void => {
  bindOrRebind(container, PRODUCTS_REPOSITORY_KEY, () => {
    container.bind<IProductsRepository>(PRODUCTS_REPOSITORY_KEY).to(ProductsRepository).inSingletonScope();
  });
};
