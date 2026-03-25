import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { Handler, Envelope, BaseCommand, Result, BasicError, ok, isErr } from '@app/core';
import { IProductsRepository, PRODUCTS_REPOSITORY_KEY } from '../../../infrastructure/prisma/products.repository';

export const CREATE_PRODUCT_COMMAND_TYPE = 'product.create';

export interface CreateProductCommand extends BaseCommand {
  id?: string;
  name: string;
  priceCents: number;
}

export interface CreateProductResponse {
  id: string;
}

@injectable()
export class CreateProductCommandHandler
  implements Handler<CreateProductCommand, CreateProductResponse>
{
  constructor(
    @inject(PRODUCTS_REPOSITORY_KEY)
    private readonly repo: IProductsRepository,
  ) {}

  async handle(
    env: Envelope<CreateProductCommand>,
  ): Promise<Result<CreateProductResponse, BasicError>> {
    const { id, name, priceCents } = env.payload;
    const result = await this.repo.create({
      id,
      name,
      priceCents,
    });

    if (isErr(result)) {
      return result;
    }

    return ok({ id: result.value.id });
  }
}
