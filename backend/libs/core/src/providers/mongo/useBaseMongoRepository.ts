import {
  Db,
  Filter,
  OptionalUnlessRequiredId,
  WithId,
  IndexDescription,
  UpdateFilter,
  CreateIndexesOptions,
} from 'mongodb';
import {
  Result,
  ok,
  notFoundErr,
  BasicError,
  basicErr,
  getErrorMessage,
} from '../../utils/result';
import { Pager, PagerResult } from '../../utils/paging';

/* eslint-disable @typescript-eslint/no-unused-vars */
export interface IBaseRepository<
  TDomain extends BaseDomain,
  TDao extends BaseDao
> {
  create(domainEntity: TDomain): Promise<Result<TDomain, BasicError>>;
  getAll(): Promise<Result<TDomain[], BasicError>>;
  getById(id: string): Promise<Result<TDomain, BasicError>>;
  getByIds(ids: string[]): Promise<Result<TDomain[], BasicError>>;
  createIndex: <K extends keyof TDao>(
    fieldName: K,
    options?: CreateIndexesOptions
  ) => Promise<Result<string, BasicError>>;
  findOne(filter: Filter<TDao>): Promise<Result<TDomain | null, BasicError>>;
  getPaged(
    pager: Pager,
    filter?: GetFilter<TDao>,
    additionalFilters?: Record<string, unknown>,
    sortOptions?: Record<string, 1 | -1>
  ): Promise<Result<PagerResult<TDomain>, BasicError>>;
  getFiltered(filter: Filter<TDao>): Promise<Result<TDomain[], BasicError>>;
  update(
    filter: Filter<TDao>,
    update: UpdateFilter<TDao>,
    notFoundMessage?: string
  ): Promise<Result<TDomain, BasicError>>;
  createMany(domainEntities: TDomain[]): Promise<Result<TDomain[], BasicError>>;
  delete(id: string): Promise<Result<void, BasicError>>;
  deleteMany(filter: Filter<TDao>): Promise<Result<void, BasicError>>;
}

type BaseDao = { _id: string };
type BaseDomain = { id: string };
export type GetFilter<T> = { propertyName: keyof T; propertyValue: string };

export const useBaseRepository = <
  TDomain extends BaseDomain,
  TDao extends BaseDao
>(
  db: Db,
  collectionName: string,
  toDao: (domainEntity: TDomain) => OptionalUnlessRequiredId<TDao>,
  toDomain: (daoEntity: WithId<TDao>) => TDomain
): IBaseRepository<TDomain, TDao> => {
  return {
    async create(domainEntity: TDomain): Promise<Result<TDomain, BasicError>> {
      try {
        const daoEntity = toDao(domainEntity);
        const existing = await db
          .collection<TDao>(collectionName)
          .findOne({ _id: domainEntity.id } as Filter<TDao>);

        if (existing) {
          await db
            .collection<TDao>(collectionName)
            .replaceOne({ _id: domainEntity.id } as Filter<TDao>, daoEntity);
          return ok(domainEntity, [
            'Entity updated successfully (replaced existing)',
          ]);
        } else {
          await db.collection<TDao>(collectionName).insertOne(daoEntity);
          return ok(domainEntity, ['Entity created successfully']);
        }
      } catch (error: unknown) {
        return basicErr(
          `Failed to create/update entity: ${getErrorMessage(error)}`
        );
      }
    },

    async createMany(
      domainEntities: TDomain[]
    ): Promise<Result<TDomain[], BasicError>> {
      try {
        const messages: string[] = [];
        const results: TDomain[] = [];

        if (domainEntities.length === 0) {
          return ok(results, messages);
        }
        const daoEntities = domainEntities.map(toDao);
        const existingIds = new Set<string>();
        const existingEntities = await db
          .collection<TDao>(collectionName)
          .find({
            _id: { $in: domainEntities.map((e) => e.id) },
          } as Filter<TDao>)
          .toArray();

        for (const existing of existingEntities) {
          existingIds.add(existing._id);
        }
        const newEntities: OptionalUnlessRequiredId<TDao>[] = [];
        const updateEntities: OptionalUnlessRequiredId<TDao>[] = [];

        for (let i = 0; i < domainEntities.length; i++) {
          const domainEntity = domainEntities[i];
          const daoEntity = daoEntities[i];

          if (existingIds.has(domainEntity.id)) {
            updateEntities.push(daoEntity);
            messages.push(`Entity ${domainEntity.id} will be updated`);
          } else {
            newEntities.push(daoEntity);
            messages.push(`Entity ${domainEntity.id} will be created`);
          }

          results.push(domainEntity);
        }
        if (newEntities.length > 0) {
          await db.collection<TDao>(collectionName).insertMany(newEntities);
        }
        for (const daoEntity of updateEntities) {
          await db
            .collection<TDao>(collectionName)
            .replaceOne({ _id: daoEntity._id } as Filter<TDao>, daoEntity);
        }

        return ok(results, messages);
      } catch (error: unknown) {
        return basicErr(
          `Failed to create/update entities: ${getErrorMessage(error)}`
        );
      }
    },

    async getAll(): Promise<Result<TDomain[], BasicError>> {
      const results = await db
        .collection<TDao>(collectionName)
        .find()
        .toArray();
      return ok(results.map(toDomain));
    },

    async getById(id: string): Promise<Result<TDomain, BasicError>> {
      const filter: Filter<BaseDao> = { _id: id };
      const result = await db.collection<TDao>(collectionName).findOne(filter);

      if (!result) {
        return notFoundErr(`Document with id ${id} not found`);
      }

      return ok(toDomain(result));
    },

    async getByIds(ids: string[]): Promise<Result<TDomain[], BasicError>> {
      const filter: Filter<BaseDao> = {
        _id: { $in: Array.isArray(ids) ? ids : [ids] },
      };

      const result = await db
        .collection<TDao>(collectionName)
        .find(filter)
        .toArray();
      return ok(result.map(toDomain));
    },

    async createIndex<K extends keyof TDao>(
      fieldName: K,
      options?: CreateIndexesOptions
    ): Promise<Result<string, BasicError>> {
      try {
        const collection = db.collection<TDao>(collectionName);
        const indexes: IndexDescription[] = await collection
          .listIndexes()
          .toArray();
        const indexName = options?.name ?? String(fieldName);
        const exists = indexes.some((idx) => idx.name === indexName);
        if (exists) {
          return ok('Index already exists');
        }
        const createdIndexName = await collection.createIndex(
          { [fieldName as string]: 1 },
          { ...options, name: indexName }
        );
        return ok(`Index created successfully on field: ${createdIndexName}`);
      } catch (error: unknown) {
        return basicErr(`Failed to create index: ${getErrorMessage(error)}`);
      }
    },

    async findOne(
      filter: Filter<TDao>
    ): Promise<Result<TDomain, BasicError>> {
      try {
        const result = await db
          .collection<TDao>(collectionName)
          .findOne(filter);
        if (!result) {
           return notFoundErr(`Document with id ${filter._id} not found`);
        }
        return ok(toDomain(result));
      } catch (error: unknown) {
        return basicErr(`Failed to find entity: ${getErrorMessage(error)}`);
      }
    },

    async getPaged(
      pager: Pager,
      getFilter?: GetFilter<TDao>,
      additionalFilters?: Record<string, unknown>,
      sortOptions?: Record<string, 1 | -1>
    ): Promise<Result<PagerResult<TDomain>, BasicError>> {
      const { pageSize, cursor } = pager;
      try {
        const collection = db.collection<TDao>(collectionName);
        const baseFilter: Filter<TDao> = getFilter
          ? ({
              [getFilter.propertyName]: getFilter.propertyValue,
            } as Filter<TDao>)
          : {};

        const filter = {
          ...baseFilter,
          ...(cursor ? { _id: { $gt: cursor } } : {}),
          ...(additionalFilters || {}),
        };

        const results = await collection
          .find(filter)
          .sort(sortOptions || { _id: 1 })
          .limit(pageSize + 1)
          .toArray();

        if (results.length === 0) {
          return ok({ data: [], cursor: undefined });
        }

        const hasNextPage = results.length > pageSize;
        const paginatedResults = hasNextPage
          ? results.slice(0, pageSize)
          : results;
        const nextCursor = hasNextPage
          ? paginatedResults[paginatedResults.length - 1]._id
          : undefined;

        return ok({
          data: paginatedResults.map(toDomain),
          cursor: nextCursor,
        });
      } catch (error: unknown) {
        return basicErr(`Pagination failed: ${getErrorMessage(error)}`);
      }
    },

    async getFiltered(
      filter: Filter<TDao>
    ): Promise<Result<TDomain[], BasicError>> {
      const results = await db
        .collection<TDao>(collectionName)
        .find(filter)
        .toArray();
      if (results.length === 0) {
        return notFoundErr('No documents found matching the filter criteria');
      }

      return ok(results.map(toDomain));
    },

    async update(
      filter: Filter<TDao>,
      update: UpdateFilter<TDao>,
      notFoundMessage?: string
    ): Promise<Result<TDomain, BasicError>> {
      try {
        const result = await db
          .collection<TDao>(collectionName)
          .findOneAndUpdate(filter, update, { returnDocument: 'after' });

        if (!result) {
          return notFoundErr(
            notFoundMessage ?? 'Document matching the filter criteria not found'
          );
        }

        return ok(toDomain(result), ['Entity updated successfully']);
      } catch (error: unknown) {
        return basicErr(`Failed to update entity: ${getErrorMessage(error)}`);
      }
    },

    async delete(id: string): Promise<Result<void, BasicError>> {
      const filter: Filter<BaseDao> = { _id: id };
      const result = await db
        .collection<TDao>(collectionName)
        .deleteOne(filter);

      if (result.deletedCount === 0) {
        return notFoundErr(`Document with id ${id} not found`);
      }

      return ok(undefined, ['Entity deleted successfully']);
    },

    async deleteMany(filter: Filter<TDao>): Promise<Result<void, BasicError>> {
      const result = await db
        .collection<TDao>(collectionName)
        .deleteMany(filter);

      if (result.deletedCount === 0) {
        return notFoundErr(`No documents matching the filter criteria found`);
      }

      return ok(undefined, [`${result.deletedCount} entities deleted`]);
    },
  };
};
