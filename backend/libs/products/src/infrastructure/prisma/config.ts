import { PrismaModuleConfig, buildPrismaModuleConfig } from '@app/core/prisma';

/**
 * Builds Prisma module configuration for products schema from environment variables
 * @returns PrismaModuleConfig with the database URL
 */
export const buildProductsPrismaConfig = (): PrismaModuleConfig =>
  buildPrismaModuleConfig('products', 'DATABASE_URL_PRODUCTS');

