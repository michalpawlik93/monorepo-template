import { inject, injectable } from 'inversify';
import {
  LOGGING_TYPES,
  ModuleLogger,
  type LoggerFactory,
} from '@app/core';

export const PRODUCT_LOGGER = Symbol.for('ProductLogger');

@injectable()
export class ProductLogger extends ModuleLogger {
  constructor(
    @inject(LOGGING_TYPES.LoggerFactory)
    loggerFactory: LoggerFactory,
  ) {
    super(loggerFactory, 'PRODUCT', { component: 'product' });
  }
}
