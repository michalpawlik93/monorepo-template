import { Container } from 'inversify';
import {
  type ILogger,
  type LoggerConfig,
  registerLogging,
  RequestContext,
} from './features';
import { bindRequestContext } from './utils';

export interface CoreModuleConfig {
  logger: LoggerConfig;
  requestContext?: RequestContext;
}

export const createCoreModuleContainer = (
  config: CoreModuleConfig,
): Container => {
  const container = new Container();
  container.bind<Container>(Container).toConstantValue(container);

  bindRequestContext(container, config.requestContext);
  registerLogging(container, config.logger);

  return container;
};

export const connectCoreInfrastructure = async (
  _container: Container,
  _logger: ILogger,
): Promise<void> => {};

export const disconnectCoreInfrastructure = async (
  _container: Container,
  _logger: ILogger,
): Promise<void> => {};


