import { Container } from 'inversify';
import { Db } from 'mongodb';
import { MongoConnection } from './mongoConnection';
import { CORE_MONGO_TOKENS, MONGO_TOKENS, type MongoConfig, type MongoTokens } from './types';
import { bindOrRebind } from '../../utils/inversify';
import { LoggerFactory, LOGGING_TYPES } from '../../features/logging';

export const registerMongoConnection = (
  container: Container,
  config: MongoConfig,
  tokens: MongoTokens = MONGO_TOKENS,
): MongoConnection => {
  bindOrRebind(container, tokens.MONGOCONFIG_KEY, () => {
    container.bind<MongoConfig>(tokens.MONGOCONFIG_KEY).toConstantValue(config);
  });

  bindOrRebind(container, tokens.MONGOCONNECTION_KEY, () => {
    container
      .bind<MongoConnection>(tokens.MONGOCONNECTION_KEY)
      .toDynamicValue(() => {
        const cfg = container.get<MongoConfig>(tokens.MONGOCONFIG_KEY);
        const loggerFactory = container.get<LoggerFactory>(LOGGING_TYPES.LoggerFactory);
        return new MongoConnection(cfg, loggerFactory);
      })
      .inSingletonScope();
  });

  bindOrRebind(container, tokens.MONGODB_KEY, () => {
    container
      .bind<Db>(tokens.MONGODB_KEY)
      .toDynamicValue(() => {
        const mc = container.get<MongoConnection>(tokens.MONGOCONNECTION_KEY);
        return mc.client.db();
      })
      .inSingletonScope();
  });

  return container.get<MongoConnection>(tokens.MONGOCONNECTION_KEY);
};

export { CORE_MONGO_TOKENS };
