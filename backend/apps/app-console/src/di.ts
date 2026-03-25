import {
  ILogger,
  LoggerFactory,
  LOGGING_TYPES,
  RequestContext,
  connectCoreInfrastructure,
  disconnectCoreInfrastructure,
  createCoreModuleContainer,
  ModuleContainer,
} from '@app/core';
import {
  buildProductsPrismaConfig,
  createProductsModuleContainer,
  connectProductsInfrastructure,
  disconnectProductsInfrastructure,
} from '@app/products';
import {
  buildProductsLoggerConfig,
  buildCoreLoggerConfig,
} from './config';

export interface SetupResult {
  modules: {
    core: ModuleContainer;
    products: ModuleContainer;
  };
  requestContext: RequestContext;
}

export async function setupContainer(): Promise<SetupResult> {
  const requestContext = new RequestContext();

  const coreContainer = createCoreModuleContainer({
    logger: buildCoreLoggerConfig(),
    requestContext,
  });
  const coreLogger = coreContainer.get<ILogger>(LOGGING_TYPES.BaseLogger);

  const productsContainer = createProductsModuleContainer({
    logger: buildProductsLoggerConfig(),
    prisma: buildProductsPrismaConfig(),
    coreContainer,
    requestContext,
  });
  const productsLoggerFactory =
    productsContainer.get<LoggerFactory>(LOGGING_TYPES.LoggerFactory);
  const productsLogger = productsLoggerFactory.forScope(
    'products.infrastructure',
  );

  const modules: SetupResult['modules'] = {
    core: {
      name: 'core',
      container: coreContainer,
      connect: () => connectCoreInfrastructure(coreContainer, coreLogger),
      disconnect: () =>
        disconnectCoreInfrastructure(coreContainer, coreLogger),
    },
    products: {
      name: 'products',
      container: productsContainer,
      connect: () =>
        connectProductsInfrastructure(productsContainer, productsLogger),
      disconnect: () =>
        disconnectProductsInfrastructure(productsContainer, productsLogger),
    },
  };
  return { modules, requestContext };
}
