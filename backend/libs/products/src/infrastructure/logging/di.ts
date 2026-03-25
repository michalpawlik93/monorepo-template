import { Container } from 'inversify';
import type { ILogger } from '@app/core';
import { ProductLogger, PRODUCT_LOGGER } from './productLogger';

export const registerProductLogging = (container: Container) => {
  if (!container.isBound(ProductLogger)) {
    container.bind(ProductLogger).toSelf().inSingletonScope();
  }

  if (!container.isBound(PRODUCT_LOGGER)) {
    container
      .bind<ILogger>(PRODUCT_LOGGER)
      .toDynamicValue(
        (ctx) =>
          (ctx as unknown as { container: Container }).container.get(
            ProductLogger,
          ),
      );
  }
};
