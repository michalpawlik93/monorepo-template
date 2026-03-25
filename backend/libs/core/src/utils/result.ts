import { z, ZodType } from 'zod';

export class Ok<T = null> {
  readonly _tag = 'ok';
  value: T;
  messages?: string[];

  constructor(value: T, messages?: string[]) {
    this.value = value;
    this.messages = messages;
  }
}

export class Err<E extends BasicError> {
  readonly _tag = 'err';
  error: E;

  constructor(error: E) {
    this.error = error;
  }
}

export type BasicError = { message: string; _type: string; cause?: unknown };

export type Result<T, E extends BasicError> =
  | Ok<T>
  | Err<E>
  | Ok<null>
  | Err<BasicError>;

export function ok<T>(value: T, messages?: string[]): Ok<T> {
  return new Ok(value, messages);
}

export function empty(messages?: string[]): Ok<null> {
  return new Ok<null>(null, messages);
}

export function emptyArray<T>(messages?: string[]): Ok<T[]> {
  return ok([], messages);
}

export function err<E extends BasicError>(error: E): Err<E> {
  return new Err(error);
}
export function basicErr(message: string, cause?: unknown): Err<BasicError> {
  return new Err({ message, _type: SystemErrorType, cause });
}

export function isOk<T, E extends BasicError>(
  result: Result<T, E>
): result is Ok<T> {
  return result._tag === 'ok';
}

export function isErr<T, E extends BasicError>(
  result: Result<T, E>
): result is Err<E> {
  return result._tag === 'err';
}

export async function combineResults<T, E extends BasicError>(
  ...tasks: Array<() => Promise<Result<T, E>>>
): Promise<Result<null, E>> {
  const aggregatedMessages: string[] = [];

  for (const task of tasks) {
    const result = await task();
    if (isErr(result)) {
      return result;
    }
    if (isOk(result) && result.messages) {
      aggregatedMessages.push(...result.messages);
    }
  }

  return empty(aggregatedMessages.length > 0 ? aggregatedMessages : undefined);
}

export function errorsToString<E extends BasicError>(error: Err<E>): string {
  return `[${error.error._type}] ${error.error.message}`;
}

export function notFoundErr(message: string): Err<NotFoundMessage> {
  return new Err({ message, _type: NotFoundErrorType });
}
export type NotFoundMessage = { message: string; _type: 'NotFoundError' };

export function isNotFound<T, E extends BasicError>(
  result: Result<T, E>
): result is Err<NotFoundMessage> {
  return isErr(result) && result.error._type === NotFoundErrorType;
}

export function unauthorizedErr(message: string): Err<UnauthorizedMessage> {
  return new Err({ message, _type: UnauthorizedErrorType });
}
export type UnauthorizedMessage = {
  message: string;
  _type: 'UnauthorizedError';
};

export function isUnauthorized<T, E extends BasicError>(
  result: Result<T, E>
): result is Err<UnauthorizedMessage> {
  return isErr(result) && result.error._type === UnauthorizedErrorType;
}

const SystemErrorType = 'SystemError';
const NotFoundErrorType = 'NotFoundError';
const UnauthorizedErrorType = 'UnauthorizedError';

const BasicErrorSchema = z.object({
  message: z.string(),
  _type: z.string(),
  cause: z.unknown().optional(),
});

export function createResultSchema<T>(valueSchema: ZodType<T>) {
  const OkSchema = z.object({
    _tag: z.literal('ok'),
    value: valueSchema,
    messages: z.array(z.string()).optional(),
  });

  const ErrSchema = z.object({
    _tag: z.literal('err'),
    error: BasicErrorSchema,
  });

  return z.union([OkSchema, ErrSchema]);
}

export function mapOkMessages<T, U, E extends BasicError>(
  result: Result<T, E>,
  newValue: U
): Result<U, E> {
  if (isOk(result)) {
    return ok(newValue, result.messages);
  }
  return result as Err<E>;
}

export const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);
