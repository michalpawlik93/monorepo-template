import { Container } from "inversify";
import { ILogger, RequestContext } from "../features";

export const setupConnections = async (modules: ModuleContainer[]) => {
  for (const moduleContainer of modules) {
    await moduleContainer.connect();
  }
  return modules;
};

export async function cleanConnections(
  modules?: ModuleContainer[],
  logger?: ILogger,
) {
  if (!modules) {
    return;
  }

  for (const moduleContainer of [...modules].reverse()) {
    try {
      await moduleContainer.disconnect();
    } catch (error) {
      if (logger) {
        logger.error(
          { error, module: moduleContainer.name },
          `Error disconnecting module ${moduleContainer.name}`,
        );
        continue;
      }

      console['error'](
        `Error disconnecting module ${moduleContainer.name}:`,
        error,
      );
    }
  }
}

export interface ModuleContainer {
  name: ModuleContainerName;
  container: Container;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

export type ModuleContainerName = 'core' | 'products';

export interface SetupResult {
  modules: {
    core: ModuleContainer;
    products: ModuleContainer;
  };
  requestContext: RequestContext;
  appContainer?: Container;
}
