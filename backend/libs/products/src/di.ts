import { Container } from 'inversify';
import {
  type ILogger,
  type LoggerConfig,
  registerLogging,
  registerServiceBus,
  RequestContext,
  bindRequestContext,
} from '@app/core';
import { PrismaModuleConfig, disconnectPrismaClient } from '@app/core/prisma';
import { registerProductsPrisma, registerProductsRepository } from './infrastructure/prisma';
import { PRODUCTS_TOKENS } from './infrastructure/prisma/di';
import { registerProductFacades, registerProductsCommandHandlers } from './application/base';
import { registerProductLogging } from './infrastructure/logging';

export interface ProductsDomainConfig {
  prisma?: PrismaModuleConfig;
}

export interface ProductsModuleConfig extends ProductsDomainConfig {
  logger: LoggerConfig;
  coreContainer?: Container;
  requestContext?: RequestContext;
}


export const createProductsModuleContainer = (
  config: ProductsModuleConfig,
): Container => {
  const container = new Container();
  container.bind<Container>(Container).toConstantValue(container);

  bindRequestContext(container, config.requestContext);
  registerLogging(container, config.logger);
  registerServiceBus(container);

  registerProductsDomain(container, { prisma: config.prisma });
  return container;
};

export const registerProductsDomain = (
  container: Container,
  config: ProductsDomainConfig,
): void => {
  registerProductLogging(container);
  registerProductsPrisma(container, config.prisma);
  registerProductsRepository(container);
  registerProductsCommandHandlers(container);
  registerProductFacades(container);
};

export const connectProductsInfrastructure = async (
  _container: Container,
  _logger: ILogger,
): Promise<void> => {
  return Promise.resolve();
};

export const disconnectProductsInfrastructure = async (
  container: Container,
  logger: ILogger,
): Promise<void> => {
  try {
    await disconnectPrismaClient(container, PRODUCTS_TOKENS.PRISMA_CLIENT);
  } catch (error) {
    logger.error({ error }, 'Error disconnecting products infrastructure');
  }
};
