import { Container } from 'inversify';
import type {
  BaseCommand,
  Envelope,
  Handler,
} from '../features/serviceBus/serviceBus';
import { TYPES } from '../features/serviceBus/serviceBus';
import type { BasicError, Result } from './result';

type MaybePromise<T> = T | Promise<T>;

export interface CommandHandlerMockConfig<
  TCommand extends BaseCommand,
  TResult,
> {
  defaultResult: (
    env: Envelope<TCommand>,
  ) => MaybePromise<Result<TResult, BasicError>>;
  result?: MaybePromise<Result<TResult, BasicError>>;
}

class CommandHandlerMock<TCommand extends BaseCommand, TResult>
  implements Handler<TCommand, TResult>
{
  constructor(
    private readonly config: CommandHandlerMockConfig<TCommand, TResult>,
  ) {}

  async handle(
    env: Envelope<TCommand>,
  ): Promise<Result<TResult, BasicError>> {
    const outcome = this.config.result ?? this.config.defaultResult(env);
    return Promise.resolve(outcome);
  }
}

export const createCommandHandlerMock = <
  TCommand extends BaseCommand,
  TResult,
>(
  config: CommandHandlerMockConfig<TCommand, TResult>,
): Handler<TCommand, TResult> =>
  new CommandHandlerMock<TCommand, TResult>(config);

export const bindCommandHandlerMock = <
  TCommand extends BaseCommand,
  TResult,
>(
  container: Container,
  commandType: string,
  handler: Handler<TCommand, TResult>,
): Container => {
  if (container.isBound(TYPES.Handler)) {
    container.unbindSync(TYPES.Handler);
  }

  container
    .bind<Handler<TCommand>>(TYPES.Handler)
    .toConstantValue(handler)
    .whenNamed(commandType);

  return container;
};

export const registerCommandHandlerMock = <
  TCommand extends BaseCommand,
  TResult,
>(
  container: Container,
  commandType: string,
  config: CommandHandlerMockConfig<TCommand, TResult>,
): Container => {
  const handler = createCommandHandlerMock<TCommand, TResult>(config);
  return bindCommandHandlerMock<TCommand, TResult>(
    container,
    commandType,
    handler,
  );
};
