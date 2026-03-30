import type { IProductBaseFacade } from '@app/integration-contracts';

export const createProductFacadeMock = (): jest.Mocked<
  Partial<IProductBaseFacade>
> => ({
  invokeCreateProduct: jest.fn(),
  invokeDeleteProduct: jest.fn(),
  getPagedProducts: jest.fn(),
});
