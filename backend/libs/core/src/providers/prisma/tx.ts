import { AsyncLocalStorage } from 'node:async_hooks';
import { PrismaClient } from './generated/prisma';

const als = new AsyncLocalStorage<PrismaClient>();
let baseClient: PrismaClient | null = null;

export const setCorePrismaClient = (client: PrismaClient): void => {
  if (baseClient && baseClient !== client) {
    throw new Error('Core Prisma client is already initialized');
  }

  baseClient = client;
};

const getCoreBaseClient = (): PrismaClient => {
  if (!baseClient) {
    throw new Error('Core Prisma client has not been initialized');
  }

  return baseClient;
};

export const coreDb = (): PrismaClient => {
  return als.getStore() ?? getCoreBaseClient();
};

export const runInCoreTx = async <T>(fn: () => Promise<T>): Promise<T> => {
  return getCoreBaseClient().$transaction(async (tx) => {
    return als.run(tx as unknown as PrismaClient, fn);
  });
};
