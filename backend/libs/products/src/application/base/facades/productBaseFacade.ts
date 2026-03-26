import 'reflect-metadata';
import { injectable } from 'inversify';
import {
  BusResolver,
  Transport,
  Envelope,
  Result,
  BasicError,
  isErr,
  Pager,
  PagerResult,
} from '@app/core';
import {
  IProductBaseFacade,
  CreateProductCommandContract,
  CreateProductResponseContract,
  DeleteProductCommandContract,
  DeleteProductResponseContract,
  ProductContract,
} from '@app/integration-contracts';
import {
  CREATE_PRODUCT_COMMAND_TYPE,
  CreateProductCommand,
  CreateProductResponse,
} from '../handlers/createProductCommandHandler';
import {
  DELETE_PRODUCT_COMMAND_TYPE,
  DeleteProductCommand,
  DeleteProductResponse,
} from '../handlers/deleteProductCommandHandler';
import {
  GET_PAGED_PRODUCTS_COMMAND,
  GetPagedProductsCommand,
} from '../handlers/getPagedProductsCommandHandler';
import { Product } from '../../../domain/models/product';
import { ulid } from 'ulid';

@injectable()
export class ProductBaseFacade
  implements IProductBaseFacade
{
  constructor(
    private readonly resolveBus: BusResolver,
  ) {}

  async invokeCreateProduct(
    payload: CreateProductCommandContract,
    opts?: { via?: Transport },
  ): Promise<Result<CreateProductResponseContract, BasicError>> {
    const busResult = this.resolveBus(opts?.via);

    if (isErr(busResult)) {
      return busResult;
    }

    const envelope: Envelope<CreateProductCommand> = {
      type: CREATE_PRODUCT_COMMAND_TYPE,
      payload: payload as CreateProductCommand,
      meta: {commandId: ulid()},
    };

    return busResult.value.invoke<CreateProductCommand, CreateProductResponse>(
      envelope,
    );
  }

  async invokeDeleteProduct(
    payload: DeleteProductCommandContract,
    opts?: { via?: Transport },
  ): Promise<Result<DeleteProductResponseContract, BasicError>> {
    const busResult = this.resolveBus(opts?.via);

    if (isErr(busResult)) {
      return busResult;
    }

    const envelope: Envelope<DeleteProductCommand> = {
      type: DELETE_PRODUCT_COMMAND_TYPE,
      payload: payload as DeleteProductCommand,
      meta: { commandId: ulid() },
    };

    return busResult.value.invoke<
      DeleteProductCommand,
      DeleteProductResponse
    >(envelope);
  }

  async getPagedProducts(
    pager: Pager,
    opts?: { via?: Transport },
  ): Promise<Result<PagerResult<ProductContract>, BasicError>> {
    const busResult = this.resolveBus(opts?.via);

    if (isErr(busResult)) {
      return busResult;
    }

    const envelope: Envelope<GetPagedProductsCommand> = {
      type: GET_PAGED_PRODUCTS_COMMAND,
      payload: { pager },
      meta: {commandId: ulid()},
    };

    const result = await busResult.value.invoke<
      GetPagedProductsCommand,
      PagerResult<Product>
    >(envelope);

    if (isErr(result)) {
      return result;
    }

    return {
      ...result,
      value: {
        cursor: result.value.cursor,
        data: result.value.data.map((product) => ({
          id: product.id,
          name: product.name,
          priceCents: product.priceCents,
        })),
      },
    };
  }
}
