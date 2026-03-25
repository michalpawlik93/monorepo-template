import { injectable } from 'inversify';
import { productsDb } from './tx';
import {
  Result,
  BasicError,
  ok,
  notFoundErr,
  basicErr,
  Pager,
  PagerResult,
  getErrorMessage,
} from '@app/core';
import { Product } from '../../domain/models/product';

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

const toDomain = (record: {
  id: string;
  name: string;
  priceCents: number;
  createdAt: Date;
  updatedAt: Date;
}): Product => ({
  id: record.id,
  name: record.name,
  priceCents: record.priceCents,
  createdAt: record.createdAt,
  updatedAt: record.updatedAt,
});

@injectable()
export class ProductsRepository implements IProductsRepository {
  private get db() {
    return productsDb();
  }

  async findById(id: string): Promise<Result<Product, BasicError>> {
    try {
      const product = await this.db.product.findUnique({ where: { id } });
      if (!product) {
        return notFoundErr(`Product with id ${id} not found`);
      }
      return ok(toDomain(product));
    } catch (error) {
      return basicErr(`Failed to find product: ${getErrorMessage(error)}`, error);
    }
  }

  async create(
    data: Pick<Product, 'name' | 'priceCents'> & { id?: string },
  ): Promise<Result<Product, BasicError>> {
    try {
      const created = await this.db.product.create({
        data: {
          ...data,
        },
      });
      return ok(toDomain(created));
    } catch (error) {
      return basicErr(`Failed to create product: ${getErrorMessage(error)}`, error);
    }
  }

  async update(
    id: string,
    data: Partial<Pick<Product, 'name' | 'priceCents'>>,
  ): Promise<Result<Product, BasicError>> {
    try {
      const updated = await this.db.product.update({
        where: { id },
        data,
      });
      return ok(toDomain(updated));
    } catch (error) {
      return basicErr(`Failed to update product ${id}: ${getErrorMessage(error)}`, error);
    }
  }

  async delete(id: string): Promise<Result<Product, BasicError>> {
    try {
      const deleted = await this.db.product.delete({ where: { id } });
      return ok(toDomain(deleted));
    } catch (error) {
      return basicErr(`Failed to delete product ${id}: ${getErrorMessage(error)}`, error);
    }
  }

  async getPaged(
    pager: Pager,
  ): Promise<Result<PagerResult<Product>, BasicError>> {
    try {
      const { pageSize, cursor } = pager;
      const records = await this.db.product.findMany({
        take: pageSize + 1,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        orderBy: { id: 'asc' },
      });

      if (records.length === 0) {
        return ok({ data: [], cursor: undefined });
      }

      const hasNext = records.length > pageSize;
      const page = hasNext ? records.slice(0, pageSize) : records;
      const nextCursor = hasNext ? page[page.length - 1]?.id : undefined;

      return ok({
        data: page.map(toDomain),
        cursor: nextCursor,
      });
    } catch (error) {
      return basicErr(`Failed to paginate products: ${getErrorMessage(error)}`, error);
    }
  }
}
