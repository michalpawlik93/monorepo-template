import { Container } from 'inversify';
import { Handler, TYPES } from '@app/core';
import {
  GET_PAGED_PRODUCTS_COMMAND,
  GetPagedProductsCommand,
  GetPagedProductsCommandHandler,
} from './getPagedProductsCommandHandler';
import {
  CREATE_PRODUCT_COMMAND_TYPE,
  CreateProductCommand,
  CreateProductCommandHandler,
} from './createProductCommandHandler';
import {
  DELETE_PRODUCT_COMMAND_TYPE,
  DeleteProductCommand,
  DeleteProductCommandHandler,
} from './deleteProductCommandHandler';

export const registerProductsCommandHandlers = (container: Container) => {
  container
    .bind<Handler<GetPagedProductsCommand>>(TYPES.Handler)
    .to(GetPagedProductsCommandHandler)
    .inSingletonScope()
    .whenNamed(GET_PAGED_PRODUCTS_COMMAND);

  container
    .bind<Handler<CreateProductCommand>>(TYPES.Handler)
    .to(CreateProductCommandHandler)
    .inSingletonScope()
    .whenNamed(CREATE_PRODUCT_COMMAND_TYPE);

  container
    .bind<Handler<DeleteProductCommand>>(TYPES.Handler)
    .to(DeleteProductCommandHandler)
    .inSingletonScope()
    .whenNamed(DELETE_PRODUCT_COMMAND_TYPE);
};
