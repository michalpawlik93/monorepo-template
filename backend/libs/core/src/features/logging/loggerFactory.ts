import "reflect-metadata";
import { inject, injectable } from "inversify";
import pino, { Logger as PinoLogger } from "pino";
import type { TransportTargetOptions } from "pino";
import * as fs from "node:fs";
import * as path from "node:path";
import type { ILogger } from "./ILogger";
import { RequestContext } from "./requestContext";
import { TYPES } from "./types";
import type { LoggerConfig } from "./LoggerConfig";

type LogMethod = (obj: unknown, msg?: string) => void;

@injectable()
export class LoggerFactory {
  private base: PinoLogger;

  constructor(
    @inject(TYPES.RequestContext) private readonly requestContext: RequestContext,
    @inject(TYPES.LoggerConfig) private readonly config: LoggerConfig,
  ) {
    const dir = path.dirname(config.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const targets: TransportTargetOptions[] = [
      {
        target: "pino/file",
        options: { destination: config.filePath, mkdir: true },
      },
    ];

    if (config.prettyInDev) {
      targets.push({
        target: "pino-pretty",
        options: {
          translateTime: "SYS:standard",
          colorize: true,
          singleLine: false,
        },
      });
    }

    this.base = pino(
      {
        level: config.level,
        redact:
          config.redact ?? [
            "password",
            "headers.authorization",
            "secret",
            "token",
          ],
        formatters: {
          bindings(bindings) {
            return { pid: bindings.pid, hostname: bindings.hostname };
          },
          level(label) {
            return { level: label };
          },
        },
      },
      pino.transport({ targets }),
    );
  }

  private wrap(instance: PinoLogger): ILogger {
    const call = (method: LogMethod, objOrMsg: unknown, msg?: string) => {
      if (typeof objOrMsg === "string" || objOrMsg === undefined) {
        method(objOrMsg ?? msg ?? "");
        return;
      }
      if (msg) {
        method(objOrMsg, msg);
        return;
      }
      method(objOrMsg);
    };

    return {
      debug: (objOrMsg: unknown, msg?: string) =>
        call(instance.debug.bind(instance), objOrMsg, msg),
      info: (objOrMsg: unknown, msg?: string) =>
        call(instance.info.bind(instance), objOrMsg, msg),
      warn: (objOrMsg: unknown, msg?: string) =>
        call(instance.warn.bind(instance), objOrMsg, msg),
      error: (objOrMsg: unknown, msg?: string) =>
        call(instance.error.bind(instance), objOrMsg, msg),
      child: (bindings: Record<string, unknown>) =>
        this.wrap(instance.child(bindings)),
    };
  }

  getBase(): ILogger {
    return this.wrap(this.base);
  }

  forScope(scope: string, extra: Record<string, unknown> = {}): ILogger {
    const context = this.requestContext.get() ?? {};
    return this.getBase().child({
      scope,
      requestId: context.requestId,
      domain: context.domain,
      ...extra,
    });
  }
}
