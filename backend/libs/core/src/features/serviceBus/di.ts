import { Container } from 'inversify';
import { ICommandBus, TYPES } from './serviceBus';
import { InMemoryServiceBus } from './inMemoryServiceBus';
import { ServiceBusLoggingMiddleware } from './serviceBusLoggingMiddleware';
import { bindOrRebind } from '../../utils/inversify';

export const COMMAND_BUS_TOKENS = {
  CommandBus: Symbol.for('ICommandBus'),
  InMemory: Symbol('InMemoryCommandBus'),
} as const;

export const registerServiceBus = (
  container: Container,
) => {

  bindOrRebind(container, COMMAND_BUS_TOKENS.InMemory, () => {
    container
      .bind<ICommandBus>(COMMAND_BUS_TOKENS.InMemory)
      .to(InMemoryServiceBus)
      .inSingletonScope();
  });

  const primaryToken = COMMAND_BUS_TOKENS.InMemory;

  bindOrRebind(container, COMMAND_BUS_TOKENS.CommandBus, () => {
    container
      .bind<ICommandBus>(COMMAND_BUS_TOKENS.CommandBus)
      .toService(primaryToken);
  });

  if (!container.isBound(TYPES.Middleware)) {
    container
      .bind(TYPES.Middleware)
      .to(ServiceBusLoggingMiddleware)
      .inSingletonScope();
  }
};
