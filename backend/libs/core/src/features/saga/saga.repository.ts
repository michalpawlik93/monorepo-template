import { injectable } from 'inversify';
import { Filter, WithId } from 'mongodb';
import {
  BasicError,
  Result,
  ok,
  isErr,
} from '../../utils/result';
import { SagaState, SagaStatus, SAGA_COLLECTION_NAME } from './saga.types';
import { MongoConnection } from '../../providers/mongo';
import {
  IBaseRepository,
  useBaseRepository,
} from '../../providers/mongo/useBaseMongoRepository';

type SagaDao<Data = unknown> = Omit<SagaState<Data>, 'data' | 'id'> & {
  _id: string;
};

type SagaDomain<Data = unknown> = SagaState<Data> & { id: string };

@injectable()
export class MongoSagaRepository<Data = unknown> {
  private readonly baseRepo: IBaseRepository<SagaDomain<Data>, SagaDao<Data>>;

  constructor(
    connection: MongoConnection,
    collectionName?: string,
  ) {
    this.baseRepo = useBaseRepository<SagaDomain<Data>, SagaDao<Data>>(
      connection.client.db(),
      collectionName ?? SAGA_COLLECTION_NAME,
      this.toDao,
      this.toDomain,
    );
  }

  async findBySagaId(
    sagaId: string,
  ): Promise<Result<SagaState<Data> | null, BasicError>> {
    const result = await this.baseRepo.findOne({
      _id: sagaId,
    } as Filter<SagaDao<Data>>);
    return isErr(result) ? result : ok(this.mapToState(result.value));
  }

  async create(initial: {
    type: string;
    sagaId: string;
    status: SagaStatus;
    data: Data;
    currentStep?: string;
    ttl: number;
    expiresAt?: Date;
  }): Promise<Result<SagaState<Data>, BasicError>> {
    const now = new Date();
    const expiresAt =
      initial.expiresAt ?? new Date(now.getTime() + initial.ttl * 1000);

    const domain: SagaDomain<Data> = {
      id: initial.sagaId,
      _id: initial.sagaId,
      type: initial.type,
      status: initial.status,
      currentStep: initial.currentStep,
      ttl: initial.ttl,
      version: 0,
      createdAt: now,
      updatedAt: now,
      expiresAt,
      tempData: null,
      data: initial.data,
    };

    const created = await this.baseRepo.create(domain);
    if (isErr(created)) {
      return created;
    }

    return ok(this.mapToState(created.value));
  }

  async save(
    state: SagaState<Data>,
  ): Promise<Result<SagaState<Data>, BasicError>> {
    const now = new Date();
    const expiresAt =
      state.expiresAt ?? new Date(now.getTime() + state.ttl * 1000);

    const updated = await this.baseRepo.update(
      {
        _id: state._id,
        version: state.version,
      } as Filter<SagaDao<Data>>,
      {
        $set: {
          status: state.status,
          currentStep: state.currentStep,
          ttl: state.ttl,
          updatedAt: now,
          expiresAt,
        },
        $inc: { version: 1 },
      },
      `Optimistic lock error for saga ${state._id} (type=${state.type})`,
    );

    if (isErr(updated)) {
      return updated;
    }

    return ok(this.mapToState(updated.value, state.data));
  }

  private toDao(domain: SagaDomain<Data>): SagaDao<Data> {
    return {
      _id: domain.id,
      type: domain.type,
      status: domain.status,
      currentStep: domain.currentStep,
      ttl: domain.ttl,
      version: domain.version,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
      expiresAt: domain.expiresAt,
      tempData: domain.tempData,
    };
  }

  private toDomain(dao: WithId<SagaDao<Data>>): SagaDomain<Data> {
    return {
      ...dao,
      id: dao._id,
    };
  }

  private mapToState(
    domain: SagaDomain<Data>,
    data?: Data,
  ): SagaState<Data> {
    const { id: _idAlias, ...rest } = domain;
    return {
      ...rest,
      data: typeof data === 'undefined' ? domain.data : data,
    };
  }
}
