import { Container } from 'inversify';
import { bindOrRebind, makeBusResolver } from '@app/core';
import {
  ProductBaseFacade,
} from './productBaseFacade';
import {
  PRODUCT_FACADE_TOKEN,
  IProductBaseFacade,
} from '@app/integration-contracts';

export const registerProductFacades = (container: Container): void => {
  bindOrRebind(container, PRODUCT_FACADE_TOKEN, () => {
    container
      .bind<IProductBaseFacade>(PRODUCT_FACADE_TOKEN)
      .toDynamicValue(() => {
        const resolver = makeBusResolver(container);
        return new ProductBaseFacade(resolver);
      })
      .inSingletonScope();
  });
};
