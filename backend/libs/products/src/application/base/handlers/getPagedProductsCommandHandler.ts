import { inject, injectable } from 'inversify';
import {
  BaseCommand,
  BasicError,
  Envelope,
  Handler,
  Pager,
  PagerResult,
  Result,
} from '@app/core';
import {
  IProductsRepository,
  PRODUCTS_REPOSITORY_KEY,
} from '../../../domain';
import { Product } from '../../../domain';

export interface GetPagedProductsCommand extends BaseCommand {
  pager: Pager;
}

export const GET_PAGED_PRODUCTS_COMMAND = 'product.getPaged';

@injectable()
export class GetPagedProductsCommandHandler
  implements Handler<GetPagedProductsCommand, PagerResult<Product>>
{
  constructor(
    @inject(PRODUCTS_REPOSITORY_KEY)
    private readonly repository: IProductsRepository,
  ) {}

  async handle(
    env: Envelope<GetPagedProductsCommand>,
  ): Promise<Result<PagerResult<Product>, BasicError>> {
    return this.repository.getPaged(env.payload.pager);
  }
}
