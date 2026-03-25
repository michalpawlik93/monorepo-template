import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import {
  Handler,
  Envelope,
  BaseCommand,
  Result,
  BasicError,
  ok,
  isErr,
} from '@app/core';
import {
  IProductsRepository,
  PRODUCTS_REPOSITORY_KEY,
} from '../../../infrastructure/prisma/products.repository';

export const DELETE_PRODUCT_COMMAND_TYPE = 'product.delete';

export interface DeleteProductCommand extends BaseCommand {
  id: string;
}

export interface DeleteProductResponse {
  id: string;
}

@injectable()
export class DeleteProductCommandHandler
  implements Handler<DeleteProductCommand, DeleteProductResponse>
{
  constructor(
    @inject(PRODUCTS_REPOSITORY_KEY)
    private readonly repo: IProductsRepository,
  ) {}

  async handle(
    env: Envelope<DeleteProductCommand>,
  ): Promise<Result<DeleteProductResponse, BasicError>> {
    const { id } = env.payload;
    const result = await this.repo.delete(id);

    if (isErr(result)) {
      return result;
    }

    return ok({ id: result.value.id });
  }
}
