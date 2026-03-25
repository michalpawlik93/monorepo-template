import {
  Result,
  BasicError,
  Pager,
  PagerResult,
  IN_MEMORY_TRANSPORT,
} from '@app/core';
import {
  IProductBaseFacade,
  ProductContract,
} from '@app/integration-contracts';

export const invokeGetPagedProducts = async (
  facade: IProductBaseFacade,
  pager: Pager,
): Promise<Result<PagerResult<ProductContract>, BasicError>> => {
  return facade.getPagedProducts(pager, { via: IN_MEMORY_TRANSPORT });
};
