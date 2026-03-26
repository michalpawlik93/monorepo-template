import { injectable } from 'inversify';
import { BasicError, Result, basicErr, getErrorMessage, notFoundErr, ok } from '@app/core';
import { IRoleRepository, Role } from '../../domain';
import { identityDb } from './tx';

const toDomain = (record: {
  id: string;
  name: string;
  description: string | null;
  rolePerms: Array<{ permission: { id: string; name: string; description: string | null } }>;
}): Role => ({
  id: record.id,
  name: record.name,
  description: record.description ?? undefined,
  permissions: record.rolePerms.map((rp) => ({
    id: rp.permission.id,
    name: rp.permission.name,
    description: rp.permission.description ?? undefined,
  })),
});

@injectable()
export class RoleRepository implements IRoleRepository {
  private get db() {
    return identityDb();
  }

  async findById(id: string): Promise<Result<Role, BasicError>> {
    try {
      const role = await this.db.role.findUnique({
        where: { id },
        include: { rolePerms: { include: { permission: true } } },
      });
      if (!role) {
        return notFoundErr(`Role with id ${id} not found`);
      }
      return ok(toDomain(role));
    } catch (error) {
      return basicErr(`Failed to find role ${id}: ${getErrorMessage(error)}`, error);
    }
  }

  async findByName(name: string): Promise<Result<Role, BasicError>> {
    try {
      const role = await this.db.role.findUnique({
        where: { name },
        include: { rolePerms: { include: { permission: true } } },
      });
      if (!role) {
        return notFoundErr(`Role ${name} not found`);
      }
      return ok(toDomain(role));
    } catch (error) {
      return basicErr(`Failed to find role ${name}: ${getErrorMessage(error)}`, error);
    }
  }

  async findAll(): Promise<Result<Role[], BasicError>> {
    try {
      const roles = await this.db.role.findMany({
        include: { rolePerms: { include: { permission: true } } },
        orderBy: { name: 'asc' },
      });
      return ok(roles.map(toDomain));
    } catch (error) {
      return basicErr(`Failed to list roles: ${getErrorMessage(error)}`, error);
    }
  }

  async create(
    data: Pick<Role, 'name' | 'description'>,
  ): Promise<Result<Role, BasicError>> {
    try {
      const role = await this.db.role.create({
        data: {
          name: data.name,
          description: data.description,
        },
        include: { rolePerms: { include: { permission: true } } },
      });
      return ok(toDomain(role));
    } catch (error) {
      return basicErr(`Failed to create role ${data.name}: ${getErrorMessage(error)}`, error);
    }
  }
}
