import { isOk, isErr } from '@app/core';
import { ProductsRepository } from '../products.repository';
import { productsDb } from '../tx';

jest.mock('../tx', () => ({
  productsDb: jest.fn(),
}));

const productsDbMock = productsDb as unknown as jest.Mock;

describe('ProductsRepository', () => {
  const now = new Date('2024-01-01T00:00:00Z');
  let dbMock: {
    product: {
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      findMany: jest.Mock;
    };
  };

  const createRepo = () => new ProductsRepository();

  beforeEach(() => {
    jest.clearAllMocks();
    dbMock = {
      product: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findMany: jest.fn(),
      },
    };
    productsDbMock.mockReturnValue(dbMock);
  });

  it('finds product by id', async () => {
    dbMock.product.findUnique.mockResolvedValue({
      id: 'p1',
      name: 'Product',
      priceCents: 1200,
      createdAt: now,
      updatedAt: now,
    });
    const repo = createRepo();

    const result = await repo.findById('p1');

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value).toEqual({
        id: 'p1',
        name: 'Product',
        priceCents: 1200,
        createdAt: now,
        updatedAt: now,
      });
    }
  });

  it('returns notFound when product missing', async () => {
    dbMock.product.findUnique.mockResolvedValue(null);
    const repo = createRepo();

    const result = await repo.findById('p1');

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.message).toBe('Product with id p1 not found');
    }
  });

  it('returns error when find fails', async () => {
    dbMock.product.findUnique.mockRejectedValue(new Error('db fail'));
    const repo = createRepo();

    const result = await repo.findById('p1');

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.message).toBe('Failed to find product: db fail');
    }
  });

  it('creates product', async () => {
    dbMock.product.create.mockResolvedValue({
      id: 'p1',
      name: 'New',
      priceCents: 500,
      createdAt: now,
      updatedAt: now,
    });
    const repo = createRepo();

    const result = await repo.create({ name: 'New', priceCents: 500 });

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.id).toBe('p1');
    }
    expect(dbMock.product.create).toHaveBeenCalledWith({
      data: { name: 'New', priceCents: 500 },
    });
  });

  it('returns error when create fails', async () => {
    dbMock.product.create.mockRejectedValue(new Error('boom'));
    const repo = createRepo();

    const result = await repo.create({ name: 'New', priceCents: 500 });

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.message).toBe('Failed to create product: boom');
    }
  });

  it('updates product', async () => {
    dbMock.product.update.mockResolvedValue({
      id: 'p1',
      name: 'Updated',
      priceCents: 800,
      createdAt: now,
      updatedAt: now,
    });
    const repo = createRepo();

    const result = await repo.update('p1', { name: 'Updated' });

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.name).toBe('Updated');
    }
    expect(dbMock.product.update).toHaveBeenCalledWith({
      where: { id: 'p1' },
      data: { name: 'Updated' },
    });
  });

  it('returns error when update fails', async () => {
    dbMock.product.update.mockRejectedValue(new Error('fail'));
    const repo = createRepo();

    const result = await repo.update('p1', { name: 'Updated' });

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.message).toBe('Failed to update product p1: fail');
    }
  });

  it('deletes product', async () => {
    dbMock.product.delete.mockResolvedValue({
      id: 'p1',
      name: 'Remove',
      priceCents: 700,
      createdAt: now,
      updatedAt: now,
    });
    const repo = createRepo();

    const result = await repo.delete('p1');

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.id).toBe('p1');
    }
    expect(dbMock.product.delete).toHaveBeenCalledWith({ where: { id: 'p1' } });
  });

  it('returns error when delete fails', async () => {
    dbMock.product.delete.mockRejectedValue(new Error('fail'));
    const repo = createRepo();

    const result = await repo.delete('p1');

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.message).toBe('Failed to delete product p1: fail');
    }
  });

  it('paginates products', async () => {
    dbMock.product.findMany.mockResolvedValue([
      {
        id: 'p1',
        name: 'First',
        priceCents: 100,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'p2',
        name: 'Second',
        priceCents: 200,
        createdAt: now,
        updatedAt: now,
      },
    ]);
    const repo = createRepo();

    const result = await repo.getPaged({ pageSize: 1, cursor: undefined });

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.data).toHaveLength(1);
      expect(result.value.cursor).toBe('p1');
    }
    expect(dbMock.product.findMany).toHaveBeenCalledWith({
      take: 2,
      orderBy: { id: 'asc' },
    });
  });

  it('returns empty page when no products', async () => {
    dbMock.product.findMany.mockResolvedValue([]);
    const repo = createRepo();

    const result = await repo.getPaged({ pageSize: 5 });

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value).toEqual({ data: [], cursor: undefined });
    }
  });
});
