import { injectable } from "inversify";
import type { ILogger } from "./ILogger";
import type { LoggerFactory } from "./loggerFactory";

@injectable()
export abstract class ModuleLogger implements ILogger {
  protected constructor(
    private readonly loggerFactory: LoggerFactory,
    private readonly scope: string,
    private readonly defaultBindings: Record<string, unknown> = {},
  ) {}

  protected get logger(): ILogger {
    return this.loggerFactory.forScope(this.scope, this.defaultBindings);
  }

  debug(objOrMsg: unknown, msg?: string): void {
    this.logger.debug(objOrMsg, msg);
  }

  info(objOrMsg: unknown, msg?: string): void {
    this.logger.info(objOrMsg, msg);
  }

  warn(objOrMsg: unknown, msg?: string): void {
    this.logger.warn(objOrMsg, msg);
  }

  error(objOrMsg: unknown, msg?: string): void {
    this.logger.error(objOrMsg, msg);
  }

  child(bindings: Record<string, unknown>): ILogger {
    return this.logger.child(bindings);
  }
}
