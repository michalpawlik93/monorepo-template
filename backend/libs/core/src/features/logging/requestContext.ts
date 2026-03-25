import { AsyncLocalStorage } from "node:async_hooks";
import { ulid } from "ulid";

export type RequestContextData = {
  requestId?: string;
  domain?: string;
};

export class RequestContext {
  private storage = new AsyncLocalStorage<RequestContextData>();

  run<T>(data: RequestContextData, fn: () => T): T {
    return this.storage.run(data, fn);
  }

  get(): RequestContextData | undefined {
    return this.storage.getStore();
  }
}

  export const runWithContext = <T>(requestContext: RequestContext, fn: () => T | Promise<T>): T | Promise<T> => {
    return requestContext.run({ requestId: ulid() }, fn);
  };