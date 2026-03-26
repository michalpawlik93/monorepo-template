import { BasicError, Pager, PagerResult, Result } from '@app/core';
import { Product } from '../models/product';

export interface IProductsRepository {
  findById: (id: string) => Promise<Result<Product, BasicError>>;
  create: (
    data: Pick<Product, 'name' | 'priceCents'> & { id?: string },
  ) => Promise<Result<Product, BasicError>>;
  update: (
    id: string,
    data: Partial<Pick<Product, 'name' | 'priceCents'>>,
  ) => Promise<Result<Product, BasicError>>;
  delete: (id: string) => Promise<Result<Product, BasicError>>;
  getPaged: (pager: Pager) => Promise<Result<PagerResult<Product>, BasicError>>;
}

export const PRODUCTS_REPOSITORY_KEY = Symbol.for('ProductsRepository');
