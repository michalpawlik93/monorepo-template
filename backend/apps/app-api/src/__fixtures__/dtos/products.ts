import type { PagerResult } from '@app/core';
import type { ProductContract } from '@app/integration-contracts';

export const mockProductContract = (
  overrides: Partial<ProductContract> = {},
): ProductContract => ({
  id: 'product-1',
  name: 'Sample Product',
  priceCents: 1999,
  ...overrides,
});

export const mockPagedProducts = (
  overrides: Partial<PagerResult<ProductContract>> = {},
): PagerResult<ProductContract> => ({
  data: [mockProductContract()],
  cursor: 'cursor-1',
  ...overrides,
});
