import {
  Result,
  BasicError,
  IN_MEMORY_TRANSPORT,
} from '@app/core';
import {
  IProductBaseFacade,
  CreateProductCommandContract,
  CreateProductResponseContract,
} from '@app/integration-contracts';

export const invokeCreateProduct = async (
  facade: IProductBaseFacade,
  payload: CreateProductCommandContract,
): Promise<Result<CreateProductResponseContract, BasicError>> => {
  return facade.invokeCreateProduct(payload, { via: IN_MEMORY_TRANSPORT });
};
