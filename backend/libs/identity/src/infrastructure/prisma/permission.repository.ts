import { injectable } from 'inversify';
import { BasicError, Result, basicErr, getErrorMessage, notFoundErr, ok } from '@app/core';
import { IPermissionRepository, Permission } from '../../domain';
import { identityDb } from './tx';

const toDomain = (record: {
  id: string;
  name: string;
  description: string | null;
}): Permission => ({
  id: record.id,
  name: record.name,
  description: record.description ?? undefined,
});

@injectable()
export class PermissionRepository implements IPermissionRepository {
  private get db() {
    return identityDb();
  }

  async findById(id: string): Promise<Result<Permission, BasicError>> {
    try {
      const permission = await this.db.permission.findUnique({ where: { id } });
      if (!permission) {
        return notFoundErr(`Permission with id ${id} not found`);
      }
      return ok(toDomain(permission));
    } catch (error) {
      return basicErr(`Failed to find permission ${id}: ${getErrorMessage(error)}`, error);
    }
  }

  async findByName(name: string): Promise<Result<Permission, BasicError>> {
    try {
      const permission = await this.db.permission.findUnique({ where: { name } });
      if (!permission) {
        return notFoundErr(`Permission ${name} not found`);
      }
      return ok(toDomain(permission));
    } catch (error) {
      return basicErr(`Failed to find permission ${name}: ${getErrorMessage(error)}`, error);
    }
  }

  async findAll(): Promise<Result<Permission[], BasicError>> {
    try {
      const permissions = await this.db.permission.findMany({ orderBy: { name: 'asc' } });
      return ok(permissions.map(toDomain));
    } catch (error) {
      return basicErr(`Failed to list permissions: ${getErrorMessage(error)}`, error);
    }
  }

  async create(
    data: Pick<Permission, 'name' | 'description'>,
  ): Promise<Result<Permission, BasicError>> {
    try {
      const created = await this.db.permission.create({
        data: {
          name: data.name,
          description: data.description,
        },
      });
      return ok(toDomain(created));
    } catch (error) {
      return basicErr(`Failed to create permission ${data.name}: ${getErrorMessage(error)}`, error);
    }
  }
}
