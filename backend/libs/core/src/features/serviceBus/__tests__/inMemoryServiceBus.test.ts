import 'reflect-metadata';
import { Container } from 'inversify';
import {
  ICommandBus,
  BaseCommand,
  Handler,
  Envelope,
  Middleware,
  TYPES,
  NoHandlerErrorType,
} from '../serviceBus';
import { InMemoryServiceBus } from '../inMemoryServiceBus';
import { Result, BasicError, ok, isOk, isErr } from '../../../utils/result';

interface TestCommand extends BaseCommand {
  data: string;
}


class TestHandler implements Handler<TestCommand, { result: string }> {
  async handle(env: Envelope<TestCommand>): Promise<Result<{ result: string }, BasicError>> {
    observedPayload = env.payload;
    return ok({ result: `Handled: ${env.payload.data}` });
  }
}

class RequestChangeMiddleware implements Middleware<{ result: string }> {
  order = 1;
  async handle(env: Envelope<TestCommand>, next: () => Promise<Result<{ result: string }, BasicError>>): Promise<Result<{ result: string }, BasicError>> {
    env.payload.data = 'Changed';
    return next();
  }
}

const TEST_COMMAND_TYPE = 'test.command';

let observedPayload: TestCommand | undefined;

describe('InMemoryServiceBus', () => {
  let container: Container;
  let serviceBus: ICommandBus;

  beforeEach(() => {
    observedPayload = undefined;
    container = new Container();
    
    container
      .bind<Handler<TestCommand, { result: string }>>(TYPES.Handler)
      .to(TestHandler)
      .inSingletonScope()
      .whenNamed(TEST_COMMAND_TYPE);
    container.bind<RequestChangeMiddleware>(TYPES.Middleware).to(
      RequestChangeMiddleware
    );

    serviceBus = new InMemoryServiceBus(container);
  });

  test('invokes a registered handler', async () => {
    const envelope: Envelope<TestCommand> = {
      type: TEST_COMMAND_TYPE,
      payload: { data: 'testData' },
    meta: { commandId: 'cmd-1' }
    };

    const result = await serviceBus.invoke<TestCommand, { result: string }>(
      envelope
    );

    if (isOk(result)) {
      expect(result.value).toEqual({ result: 'Handled: Changed' });
    }
  });

  test('returns error when handler is missing', async () => {
    container.unbindSync(TYPES.Handler);
    const envelope: Envelope<TestCommand> = {
      type: TEST_COMMAND_TYPE,
      payload: { data: 'testData' },
          meta: { commandId: 'cmd-1' }
    };

    const result = await serviceBus.invoke<TestCommand, { result: string }>(
      envelope
    );

    if (isErr(result)) {
      expect(result.error._type).toBe(NoHandlerErrorType);
    }
  });

  test('runs middleware chain before handler on invoke', async () => {
    const envelope: Envelope<TestCommand> = {
      type: TEST_COMMAND_TYPE,
      payload: { data: 'testData' },
          meta: { commandId: 'cmd-1' }
    };

    const result = await serviceBus.invoke<TestCommand, { result: string }>(
      envelope
    );

    if (isOk(result)) {
     expect(observedPayload?.data).toBe('Changed');
      expect(result.value).toEqual({ result: 'Handled: Changed' });
    }
  });
});
