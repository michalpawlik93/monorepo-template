import 'reflect-metadata';
import { injectable, inject, Container } from 'inversify';
import {
  Result,
  BasicError,
} from '../../utils/result';
import {
  BaseCommand,
  Envelope,
  Handler,
  BaseServiceBus,
  TYPES,
  noHandlerErr,
} from './serviceBus';
import { isHandlerBound, getHandler } from '../../utils/inversify';

@injectable()
export class InMemoryServiceBus extends BaseServiceBus {
  constructor(@inject(Container) container: Container) {
    super(container);
  }

  protected async invokeHandler<T extends BaseCommand, R>(
    env: Envelope<T>
  ): Promise<Result<R, BasicError>> {
    if (!isHandlerBound(this.container, TYPES.Handler, env.type)) {
      return noHandlerErr(env.type);
    }
    
    const handler = getHandler<Handler<T, R>>(
      this.container,
      TYPES.Handler,
      env.type,
    );
    return handler.handle(env);
  }
}

