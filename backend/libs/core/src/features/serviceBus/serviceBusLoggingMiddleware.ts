import { inject, injectable } from 'inversify';
import { Middleware, Envelope } from './serviceBus';
import { Result, BasicError, isErr } from '../../utils/result';
import { LoggerFactory, LOGGING_TYPES } from '../logging';

@injectable()
export class ServiceBusLoggingMiddleware implements Middleware {
  order = 5;

  constructor(
    @inject(LOGGING_TYPES.LoggerFactory)
    private readonly loggerFactory: LoggerFactory,
  ) {}

  async handle(
    env: Envelope,
    next: () => Promise<Result<unknown, BasicError>>
  ): Promise<Result<unknown, BasicError>> {
    const logger = this.loggerFactory.forScope('SERVICEBUS', { commandType: env.type });

    const payload = env.payload as { id?: string; type?: string; [key: string]: unknown };
    const commandId = payload.id || payload.type || env.type;

    logger.info(
      {
        commandType: env.type,
        commandId,
        meta: env.meta,
      },
      `Processing command: ${env.type}, id: ${commandId}`
    );

    const result = await next();

    if (isErr(result)) {
      logger.error(
        {
          commandType: env.type,
          commandId,
          error: {
            type: result.error._type,
            message: result.error.message,
          },
        },
        `Command failed: ${env.type}, id: ${commandId}`
      );
    } else {
      logger.info(
        {
          commandType: env.type,
          commandId,
        },
        `Command succeeded: ${env.type}, id: ${commandId}`
      );
    }

    return result;
  }
}
