import { Container } from "inversify";
import type { ServiceIdentifier } from "@inversifyjs/common";

export const bindOrRebind = (
    container: Container,
    identifier: ServiceIdentifier<unknown>,
    binder: () => void
  ) => {
    if (container.isBound(identifier)) {
      container.unbind(identifier);
    }
    binder();
  };

/**
 * Container with optional named binding extensions
 */
type ContainerWithNamedExtensions = Container & {
  isBoundNamed?: (
    id: ServiceIdentifier<unknown>,
    named: string | number | symbol,
  ) => boolean;
  getNamed?: <TResult>(
    id: ServiceIdentifier<unknown>,
    named: string | number | symbol,
  ) => TResult;
};

// Some Inversify distributions expose `get`/`isBound` overloads that accept
// a metadata object like `{ name: ... }`. We declare a local interface to
// describe those overloads so we can call them without using `any`.
type NamedGet = {
  isBound<T>(id: ServiceIdentifier<T>, named: { name: string | number | symbol }): boolean;
  get<T>(id: ServiceIdentifier<T>, named: { name: string | number | symbol }): T;
};

/**
 * Checks if a handler is bound for the given command type.
 * Supports both standard Inversify API and named binding extensions.
 */
export function isHandlerBound(
  container: Container,
  handlerType: symbol,
  commandType: string,
): boolean {
  const containerWithExtensions = container as ContainerWithNamedExtensions;
  
  if (typeof containerWithExtensions.isBoundNamed === 'function') {
    return containerWithExtensions.isBoundNamed(handlerType, commandType);
  }

  return (container as Container & NamedGet).isBound(handlerType, { name: commandType });
}

/**
 * Gets a handler for the given command type.
 * Supports both standard Inversify API and named binding extensions.
 */
export function getHandler<T>(
  container: Container,
  handlerType: symbol,
  commandType: string,
): T {
  const containerWithExtensions = container as ContainerWithNamedExtensions;
  
  if (typeof containerWithExtensions.getNamed === 'function') {
    return containerWithExtensions.getNamed<T>(handlerType, commandType);
  }

  return (container as Container & NamedGet).get<T>(handlerType, { name: commandType });
}
