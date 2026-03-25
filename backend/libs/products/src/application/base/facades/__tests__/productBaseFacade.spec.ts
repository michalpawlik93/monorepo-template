import 'reflect-metadata';
import { Container } from 'inversify';
import {
  ICommandBus,
  COMMAND_BUS_TOKENS,
  InMemoryServiceBus,
  makeBusResolver,
  registerCommandHandlerMock,
  isOk,
  isErr,
  ok,
  GRPC_TRANSPORT,
  IN_MEMORY_TRANSPORT,
} from '@app/core';
import { ProductBaseFacade } from '../productBaseFacade';
import {
  CREATE_PRODUCT_COMMAND_TYPE,
  CreateProductCommand,
  CreateProductResponse,
} from '../../handlers/createProductCommandHandler';
import {
  GET_PAGED_PRODUCTS_COMMAND,
  GetPagedProductsCommand,
} from '../../handlers/getPagedProductsCommandHandler';
import { PagerResult } from '@app/core';
import { ProductContract } from '@app/integration-contracts';

const setupContainer = (): Container => {
  const container = new Container();
  container.bind<Container>(Container).toConstantValue(container);
  container
    .bind<ICommandBus>(COMMAND_BUS_TOKENS.InMemory)
    .to(InMemoryServiceBus)
    .inSingletonScope();
  return container;
};

describe('ProductBaseFacade', () => {
  it('invokes create product through in-memory bus', async () => {
    const container = setupContainer();
    const handler = jest
      .fn()
      .mockImplementation((env) =>
        ok<CreateProductResponse>({ id: env.payload.id ?? 'prod-1' }),
      );
    registerCommandHandlerMock<CreateProductCommand, CreateProductResponse>(
      container,
      CREATE_PRODUCT_COMMAND_TYPE,
      { defaultResult: handler },
    );
    const facade = new ProductBaseFacade(makeBusResolver(container));

    const result = await facade.invokeCreateProduct(
      { id: 'prod-1', name: 'Test', priceCents: 1000 },
      { via: IN_MEMORY_TRANSPORT },
    );

    expect(isOk(result)).toBe(true);
    expect(handler).toHaveBeenCalled();
  });

  it('returns paged products through bus', async () => {
    const container = setupContainer();
    const handler = jest.fn().mockImplementation((env) => {
      expect(env.payload.pager.pageSize).toBe(2);
      return ok({ data: [], cursor: undefined });
    });
    registerCommandHandlerMock<
      GetPagedProductsCommand,
      PagerResult<ProductContract>
    >(
      container,
      GET_PAGED_PRODUCTS_COMMAND,
      { defaultResult: handler },
    );
    const facade = new ProductBaseFacade(makeBusResolver(container));

    const result = await facade.getPagedProducts(
      { pageSize: 2, cursor: undefined },
      { via: IN_MEMORY_TRANSPORT },
    );

    expect(isOk(result)).toBe(true);
    expect(handler).toHaveBeenCalled();
  });

  it('returns error when requested bus is missing', async () => {
    const container = setupContainer();
    const facade = new ProductBaseFacade(makeBusResolver(container));

    const result = await facade.invokeCreateProduct(
      { name: 'Test', priceCents: 100 },
      { via: GRPC_TRANSPORT},
    );

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.message).toBe(
        'GrpcCommandBus is not registered in the container',
      );
    }
  });

  it('requires transport when resolving bus', async () => {
    const container = setupContainer();
    const facade = new ProductBaseFacade(makeBusResolver(container));

    const result = await facade.getPagedProducts({ pageSize: 1 });

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.message).toBe('Transport is required');
    }
  });
});
