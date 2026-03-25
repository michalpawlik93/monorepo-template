import { injectable } from 'inversify';
import { BasicError, Result, basicErr, isErr, isNotFound } from '../../utils/result';
import { MongoSagaRepository } from './saga.repository';
import { SagaState, SagaStatus } from './saga.types';

@injectable()
export abstract class BaseSaga<Data = unknown> {
  protected abstract readonly type: string;
  protected readonly defaultTtlSeconds = 60 * 60 * 24 * 30;

  constructor(protected readonly repo: MongoSagaRepository<Data>) {}

  async start(
    sagaId: string,
    initialData: Data,
    firstStep: string,
  ): Promise<Result<SagaState<Data>, BasicError>> {
    const existingResult = await this.repo.findBySagaId(sagaId);

    if(isNotFound(existingResult)) {
      return this.repo.create({
        type: this.type,
        sagaId,
        status: SagaStatus.RUNNING,
        currentStep: firstStep,
        data: initialData,
        ttl: this.defaultTtlSeconds,
        expiresAt: this.computeExpiresAt(this.defaultTtlSeconds),
      });
    }

    if (isErr(existingResult)) {
      return existingResult;
    }

    return basicErr('Saga already started and is not resumable');
  }

  protected computeExpiresAt(ttlSeconds: number): Date {
    return new Date(Date.now() + ttlSeconds * 1000);
  }

  protected async updateState(
    saga: SagaState<Data>,
    update: {
      status?: SagaStatus;
      data?: Partial<Data>;
      currentStep?: string;
      expiresAt?: Date;
    },
  ): Promise<Result<SagaState<Data>, BasicError>> {
    const currentData = saga.data ?? ({} as Data);
    const next: SagaState<Data> = {
      ...saga,
      status: update.status ?? saga.status,
      currentStep: update.currentStep ?? saga.currentStep,
      data: update.data ? { ...currentData, ...update.data } : saga.data,
      expiresAt: update.expiresAt ?? saga.expiresAt,
    };
    return this.repo.save(next);
  }

  protected async markStep(
    saga: SagaState<Data>,
    step: string,
    data?: Partial<Data>,
  ): Promise<Result<SagaState<Data>, BasicError>> {
    return this.updateState(saga, { currentStep: step, data });
  }

  protected async markSuccess(
    saga: SagaState<Data>,
    data?: Partial<Data>,
  ): Promise<Result<SagaState<Data>, BasicError>> {
    return this.updateState(saga, {
      status: SagaStatus.SUCCESS,
      data,
    });
  }

  protected async markCompensated(
    saga: SagaState<Data>,
    data?: Partial<Data>,
  ): Promise<Result<SagaState<Data>, BasicError>> {
    return this.updateState(saga, {
      status: SagaStatus.COMPENSATED,
      data,
    });
  }

  protected async markFailed(
    saga: SagaState<Data>,
    data?: Partial<Data>,
  ): Promise<Result<SagaState<Data>, BasicError>> {
    return this.updateState(saga, {
      status: SagaStatus.FAILED,
      data,
    });
  }
}
