/* eslint-disable @typescript-eslint/no-explicit-any */
import { ok, isOk, isErr, notFoundErr } from '../../../utils/result';
import { MongoSagaRepository } from '../saga.repository';
import { SagaStatus, SagaState } from '../saga.types';
import {
  useBaseRepository,
  IBaseRepository,
} from '../../../providers/mongo/useBaseMongoRepository';

jest.mock('../../../providers/mongo/useBaseMongoRepository', () => ({
  useBaseRepository: jest.fn(),
}));

const useBaseRepositoryMock = useBaseRepository as unknown as jest.Mock;

type SagaDomain = SagaState<{ foo: string }> & { id: string };

describe('MongoSagaRepository', () => {
  const now = new Date('2024-01-01T00:00:00Z');
  let baseRepo: jest.Mocked<IBaseRepository<SagaDomain, any>>;

  const connection = {
    client: { db: jest.fn() },
  } as any;

  const createRepo = () => new MongoSagaRepository<{ foo: string }>(connection);

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(now);
    baseRepo = {
      create: jest.fn(),
      createMany: jest.fn(),
      createIndex: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      findOne: jest.fn(),
      getAll: jest.fn(),
      getById: jest.fn(),
      getByIds: jest.fn(),
      getFiltered: jest.fn(),
      getPaged: jest.fn(),
      update: jest.fn(),
    } as unknown as jest.Mocked<IBaseRepository<SagaDomain, any>>;
    useBaseRepositoryMock.mockReturnValue(baseRepo);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('finds saga by id', async () => {
    const domain: SagaDomain = {
      _id: 's1',
      id: 's1',
      type: 'Saga',
      status: SagaStatus.RUNNING,
      ttl: 60,
      version: 0,
      createdAt: now,
      updatedAt: now,
      expiresAt: now,
      currentStep: 'STEP',
      tempData: null,
      data: { foo: 'bar' },
    };
    baseRepo.findOne.mockResolvedValue(ok(domain));
    const repo = createRepo();

    const result = await repo.findBySagaId('s1');

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value).toEqual({
        _id: 's1',
        type: 'Saga',
        status: SagaStatus.RUNNING,
        ttl: 60,
        version: 0,
        createdAt: now,
        updatedAt: now,
        expiresAt: now,
        currentStep: 'STEP',
        tempData: null,
        data: { foo: 'bar' },
      });
    }
    expect(baseRepo.findOne).toHaveBeenCalledWith({
      _id: 's1',
    });
  });

  it('propagates error when saga not found', async () => {
    baseRepo.findOne.mockResolvedValue(notFoundErr('missing'));
    const repo = createRepo();

    const result = await repo.findBySagaId('missing');

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.message).toBe('missing');
    }
  });

  it('creates saga state', async () => {
    const expiresAt = new Date(now.getTime() + 60000);
    const domain: SagaDomain = {
      _id: 's1',
      id: 's1',
      type: 'Saga',
      status: SagaStatus.RUNNING,
      ttl: 60,
      version: 0,
      createdAt: now,
      updatedAt: now,
      expiresAt,
      currentStep: 'STEP',
      tempData: null,
      data: { foo: 'bar' },
    };
    baseRepo.create.mockResolvedValue(ok(domain));
    const repo = createRepo();

    const result = await repo.create({
      type: 'Saga',
      sagaId: 's1',
      status: SagaStatus.RUNNING,
      currentStep: 'STEP',
      data: { foo: 'bar' },
      ttl: 60,
    });

    expect(isOk(result)).toBe(true);
    expect(baseRepo.create).toHaveBeenCalledWith(domain);
    if (isOk(result)) {
      expect(result.value._id).toBe('s1');
      expect(result.value.data).toEqual({ foo: 'bar' });
    }
  });

  it('saves saga updates with optimistic lock filter', async () => {
    const repo = createRepo();
    const state: SagaState<{ foo: string }> = {
      _id: 's1',
      type: 'Saga',
      status: SagaStatus.SUCCESS,
      ttl: 60,
      version: 0,
      createdAt: now,
      updatedAt: now,
      expiresAt: now,
      currentStep: 'STEP',
      tempData: null,
      data: { foo: 'bar' },
    };
    baseRepo.update.mockResolvedValue(
      ok({
        ...state,
        id: 's1',
        status: SagaStatus.SUCCESS,
        version: 1,
      } as SagaDomain),
    );

    const result = await repo.save(state);

    expect(baseRepo.update).toHaveBeenCalledWith(
      {
        _id: 's1',
        version: 0,
      },
      {
        $set: {
          status: SagaStatus.SUCCESS,
          currentStep: 'STEP',
          ttl: 60,
          updatedAt: now,
          expiresAt: now,
        },
        $inc: { version: 1 },
      },
      'Optimistic lock error for saga s1 (type=Saga)',
    );
    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.status).toBe(SagaStatus.SUCCESS);
      expect(result.value.data).toEqual({ foo: 'bar' });
    }
  });

  it('returns error when save fails', async () => {
    const repo = createRepo();
    const state: SagaState<{ foo: string }> = {
      _id: 's1',
      type: 'Saga',
      status: SagaStatus.RUNNING,
      ttl: 60,
      version: 1,
      createdAt: now,
      updatedAt: now,
      expiresAt: now,
      currentStep: 'STEP',
      tempData: null,
      data: { foo: 'bar' },
    };
    baseRepo.update.mockResolvedValue(notFoundErr('lock'));

    const result = await repo.save(state);

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.message).toBe('lock');
    }
  });
});
