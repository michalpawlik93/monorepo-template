/* eslint-disable @typescript-eslint/no-explicit-any */
import { Db, Collection, WithId, IndexDescription } from 'mongodb';
import { useBaseRepository } from '../useBaseMongoRepository';
import { ok, notFoundErr, basicErr } from '../../../utils/result';

interface TestDomain {
  id: string;
  name: string;
}

interface TestDao {
  _id: string;
  name: string;
}

const toDao = (domainEntity: TestDomain): TestDao => ({
  _id: domainEntity.id,
  name: domainEntity.name,
});

const toDomain = (daoEntity: WithId<TestDao>): TestDomain => ({
  id: daoEntity._id,
  name: daoEntity.name,
});

const daoMock = (overrides?: Partial<TestDao>): TestDao => ({
  _id: '123',
  name: 'Test Name',
  ...overrides,
});

const domainMock = (overrides?: Partial<TestDomain>): TestDomain => ({
  id: '123',
  name: 'Test Name',
  ...overrides,
});

describe('useBaseRepository', () => {
  let mockDb: jest.Mocked<Db>;
  let mockCollection: jest.Mocked<Collection<TestDao>>;

  const createRepository = () =>
    useBaseRepository<TestDomain, TestDao>(
      mockDb,
      'testCollection',
      toDao,
      toDomain,
    );

  beforeEach(() => {
    mockCollection = {
      insertOne: jest.fn(),
      insertMany: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      listIndexes: jest.fn(),
      createIndex: jest.fn().mockResolvedValue('name'),
      findOneAndUpdate: jest.fn(),
      deleteOne: jest.fn(),
      deleteMany: jest.fn(),
      replaceOne: jest.fn(),
    } as unknown as jest.Mocked<Collection<TestDao>>;

    mockDb = {
      collection: jest.fn().mockReturnValue(mockCollection),
    } as unknown as jest.Mocked<Db>;
  });

  it('creates an entity when it does not exist', async () => {
    const repository = createRepository();
    mockCollection.findOne.mockResolvedValueOnce(null);

    const result = await repository.create(domainMock());

    expect(result).toEqual(ok(domainMock(), ['Entity created successfully']));
    expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: '123' });
    expect(mockCollection.insertOne).toHaveBeenCalledWith(daoMock());
  });

  it('replaces an existing entity', async () => {
    const repository = createRepository();
    mockCollection.findOne.mockResolvedValueOnce(daoMock());

    const result = await repository.create(domainMock());

    expect(result).toEqual(
      ok(domainMock(), ['Entity updated successfully (replaced existing)']),
    );
    expect(mockCollection.replaceOne).toHaveBeenCalledWith(
      { _id: '123' },
      daoMock(),
    );
  });

  it('returns a basic error when create fails', async () => {
    const repository = createRepository();
    mockCollection.findOne.mockRejectedValueOnce(new Error('Database error'));

    const result = await repository.create(domainMock());

    expect(result).toEqual(
      basicErr('Failed to create/update entity: Database error'),
    );
  });

  it('returns all entities', async () => {
    const repository = createRepository();
    mockCollection.find.mockReturnValue({
      toArray: jest.fn().mockResolvedValueOnce([
        daoMock(),
        daoMock({ _id: '456', name: 'Another' }),
      ]),
    } as unknown as any);

    const result = await repository.getAll();

    expect(result).toEqual(
      ok([
        domainMock(),
        { id: '456', name: 'Another' },
      ]),
    );
  });

  it('returns entity by id or not found', async () => {
    const repository = createRepository();
    mockCollection.findOne.mockResolvedValueOnce(daoMock());

    const found = await repository.getById('123');
    expect(found).toEqual(ok(domainMock()));

    mockCollection.findOne.mockResolvedValueOnce(null);
    const missing = await repository.getById('missing');
    expect(missing).toEqual(notFoundErr('Document with id missing not found'));
  });

  it('returns entities by ids', async () => {
    const repository = createRepository();
    mockCollection.find.mockReturnValue({
      toArray: jest.fn().mockResolvedValueOnce([
        daoMock(),
        daoMock({ _id: '456', name: 'Another' }),
      ]),
    } as unknown as any);

    const result = await repository.getByIds(['123', '456']);

    expect(result).toEqual(
      ok([
        domainMock(),
        { id: '456', name: 'Another' },
      ]),
    );
    expect(mockCollection.find).toHaveBeenCalledWith({
      _id: { $in: ['123', '456'] },
    });
  });

  it('finds one entity by filter', async () => {
    const repository = createRepository();
    mockCollection.findOne.mockResolvedValueOnce(daoMock({ _id: 'abc' }));

    const found = await repository.findOne({ _id: 'abc' });
    expect(found).toEqual(ok({ id: 'abc', name: 'Test Name' }));

    mockCollection.findOne.mockResolvedValueOnce(null);
    const missing = await repository.findOne({ _id: 'def' });
    expect(missing).toEqual(notFoundErr('Document with id def not found'));
  });

  it('creates index only when missing', async () => {
    const repository = createRepository();
    mockCollection.listIndexes.mockReturnValue({
      toArray: jest.fn().mockResolvedValueOnce([] as IndexDescription[]),
    } as unknown as any);

    const created = await repository.createIndex('name');
    expect(created).toEqual(ok('Index created successfully on field: name'));

    mockCollection.listIndexes.mockReturnValue({
      toArray: jest.fn().mockResolvedValueOnce([
        { name: 'name', key: {} } as IndexDescription,
      ]),
    } as unknown as any);

    const existing = await repository.createIndex('name');
    expect(existing).toEqual(ok('Index already exists'));
  });

  it('paginates results', async () => {
    const repository = createRepository();
    const cursor = {
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      toArray: jest.fn().mockResolvedValue([
        daoMock(),
        daoMock({ _id: '456', name: 'Next' }),
      ]),
    };
    mockCollection.find.mockReturnValue(cursor as unknown as any);

    const result = await repository.getPaged({ pageSize: 1, cursor: '000' });

    expect(result).toEqual(
      ok({
        data: [domainMock()],
        cursor: '123',
      }),
    );
    expect(cursor.sort).toHaveBeenCalledWith({ _id: 1 });
    expect(cursor.limit).toHaveBeenCalledWith(2);
    expect(mockCollection.find).toHaveBeenCalledWith({
      _id: { $gt: '000' },
    });
  });

  it('returns empty page when no data', async () => {
    const repository = createRepository();
    const cursor = {
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      toArray: jest.fn().mockResolvedValue([]),
    };
    mockCollection.find.mockReturnValue(cursor as unknown as any);

    const result = await repository.getPaged({ pageSize: 2 });

    expect(result).toEqual(ok({ data: [], cursor: undefined }));
  });

  it('filters results or returns not found', async () => {
    const repository = createRepository();
    mockCollection.find.mockReturnValue({
      toArray: jest.fn().mockResolvedValueOnce([daoMock()]),
    } as unknown as any);

    const filtered = await repository.getFiltered({ name: 'Test Name' });
    expect(filtered).toEqual(ok([domainMock()]));

    mockCollection.find.mockReturnValue({
      toArray: jest.fn().mockResolvedValueOnce([]),
    } as unknown as any);

    const missing = await repository.getFiltered({ name: 'Missing' });
    expect(missing).toEqual(
      notFoundErr('No documents found matching the filter criteria'),
    );
  });

  it('updates entities and handles not found', async () => {
    const repository = createRepository();
    mockCollection.findOneAndUpdate.mockResolvedValueOnce(
      daoMock({ name: 'Updated' }) as any,
    );

    const updated = await repository.update(
      { _id: '123' },
      { $set: { name: 'Updated' } },
    );
    expect(updated).toEqual(
      ok({ id: '123', name: 'Updated' }, ['Entity updated successfully']),
    );

    mockCollection.findOneAndUpdate.mockResolvedValueOnce(null);
    const missing = await repository.update(
      { _id: 'missing' },
      { $set: { name: 'Updated' } },
    );
    expect(missing).toEqual(
      notFoundErr('Document matching the filter criteria not found'),
    );
  });

  it('creates many entities with mixed operations', async () => {
    const repository = createRepository();
    const entities = [
      domainMock(),
      domainMock({ id: '456', name: 'Another' }),
    ];
    mockCollection.find.mockReturnValue({
      toArray: jest
        .fn()
        .mockResolvedValueOnce([daoMock({ _id: '456', name: 'Old' })]),
    } as unknown as any);
    mockCollection.insertMany.mockResolvedValueOnce(undefined as never);
    mockCollection.replaceOne.mockResolvedValueOnce(undefined as never);

    const result = await repository.createMany(entities);

    expect(result).toEqual(
      ok(entities, ['Entity 123 will be created', 'Entity 456 will be updated']),
    );
    expect(mockCollection.insertMany).toHaveBeenCalledWith([
      daoMock(),
    ]);
    expect(mockCollection.replaceOne).toHaveBeenCalledWith(
      { _id: '456' },
      daoMock({ _id: '456', name: 'Another' }),
    );
  });

  it('returns ok when creating many with empty input', async () => {
    const repository = createRepository();

    const result = await repository.createMany([]);

    expect(result).toEqual(ok([], []));
    expect(mockCollection.find).not.toHaveBeenCalled();
  });

  it('returns error when createMany fails', async () => {
    const repository = createRepository();
    mockCollection.find.mockReturnValue({
      toArray: jest.fn().mockRejectedValueOnce(new Error('Database fail')),
    } as unknown as any);

    const result = await repository.createMany([domainMock()]);

    expect(result).toEqual(
      basicErr('Failed to create/update entities: Database fail'),
    );
  });

  it('deletes entities', async () => {
    const repository = createRepository();
    mockCollection.deleteOne.mockResolvedValueOnce({
      acknowledged: true,
      deletedCount: 1,
    } as any);

    const deleted = await repository.delete('123');
    expect(deleted).toEqual(ok(undefined, ['Entity deleted successfully']));

    mockCollection.deleteOne.mockResolvedValueOnce({
      acknowledged: true,
      deletedCount: 0,
    } as any);

    const missing = await repository.delete('missing');
    expect(missing).toEqual(notFoundErr('Document with id missing not found'));
  });

  it('deletes many entities', async () => {
    const repository = createRepository();
    mockCollection.deleteMany.mockResolvedValueOnce({
      acknowledged: true,
      deletedCount: 2,
    } as any);

    const deleted = await repository.deleteMany({ name: 'Test' });
    expect(deleted).toEqual(ok(undefined, ['2 entities deleted']));

    mockCollection.deleteMany.mockResolvedValueOnce({
      acknowledged: true,
      deletedCount: 0,
    } as any);

    const missing = await repository.deleteMany({ name: 'Missing' });
    expect(missing).toEqual(
      notFoundErr('No documents matching the filter criteria found'),
    );
  });
});
