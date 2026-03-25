
import { Container } from 'inversify';
import { bindOrRebind } from '../../utils/inversify';
import { MongoSagaRepository } from './saga.repository';
import { CORE_MONGO_TOKENS, MongoConnection } from '../../providers';

export const CORE_SAGA_REPOSITORY = Symbol.for('CoreSagaRepository');

export const registerCoreSagaRepository = (container: Container): void => {
  bindOrRebind(container, CORE_SAGA_REPOSITORY, () => {
    container
      .bind<MongoSagaRepository>(CORE_SAGA_REPOSITORY)
      .toDynamicValue(() => {
        const connection = container.get<MongoConnection>(CORE_MONGO_TOKENS.MONGOCONNECTION_KEY);
        return new MongoSagaRepository(connection);
      })
      .inSingletonScope();
  });
};
