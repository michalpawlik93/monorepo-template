import { AsyncLocalStorage } from 'node:async_hooks';
import { PrismaClient } from './generated/prisma';

const als = new AsyncLocalStorage<PrismaClient>();
let baseClient: PrismaClient | null = null;

export const setProductsPrismaClient = (client: PrismaClient): void => {
  if (baseClient && baseClient !== client) {
    throw new Error('Products Prisma client is already initialized');
  }

  baseClient = client;
};

const getProductsBaseClient = (): PrismaClient => {
  if (!baseClient) {
    throw new Error('Products Prisma client has not been initialized');
  }

  return baseClient;
};

export const productsDb = (): PrismaClient => {
  return als.getStore() ?? getProductsBaseClient();
};

export const runInProductsTx = async <T>(fn: () => Promise<T>): Promise<T> => {
  return getProductsBaseClient().$transaction(async (tx) => {
    return als.run(tx as unknown as PrismaClient, fn);
  });
};
