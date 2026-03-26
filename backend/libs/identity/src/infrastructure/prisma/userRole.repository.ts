import { injectable } from 'inversify';
import { BasicError, Result, basicErr, getErrorMessage, ok } from '@app/core';
import { IUserRoleRepository, Role } from '../../domain';
import { identityDb } from './tx';

const toRole = (record: {
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
export class UserRoleRepository implements IUserRoleRepository {
  private get db() {
    return identityDb();
  }

  async findRolesByUserId(userId: string): Promise<Result<Role[], BasicError>> {
    try {
      const userRoles = await this.db.userRole.findMany({
        where: { userId },
        include: {
          role: {
            include: {
              rolePerms: {
                include: { permission: true },
              },
            },
          },
        },
      });
      return ok(userRoles.map((r) => toRole(r.role)));
    } catch (error) {
      return basicErr(`Failed to fetch user roles for ${userId}: ${getErrorMessage(error)}`, error);
    }
  }

  async assignRole(userId: string, roleId: string): Promise<Result<null, BasicError>> {
    try {
      await this.db.userRole.upsert({
        where: { userId_roleId: { userId, roleId } },
        create: { userId, roleId },
        update: {},
      });
      return ok(null);
    } catch (error) {
      return basicErr(`Failed to assign role ${roleId} to user ${userId}: ${getErrorMessage(error)}`, error);
    }
  }

  async removeRole(userId: string, roleId: string): Promise<Result<null, BasicError>> {
    try {
      await this.db.userRole.delete({ where: { userId_roleId: { userId, roleId } } });
      return ok(null);
    } catch (error) {
      return basicErr(`Failed to remove role ${roleId} from user ${userId}: ${getErrorMessage(error)}`, error);
    }
  }

  async getEffectivePermissions(userId: string): Promise<Result<string[], BasicError>> {
    try {
      const userRoles = await this.db.userRole.findMany({
        where: { userId },
        include: {
          role: {
            include: {
              rolePerms: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      });

      const permissions = new Set<string>();
      for (const userRole of userRoles) {
        for (const rolePermission of userRole.role.rolePerms) {
          permissions.add(rolePermission.permission.name);
        }
      }

      return ok(Array.from(permissions.values()).sort());
    } catch (error) {
      return basicErr(`Failed to fetch effective permissions for ${userId}: ${getErrorMessage(error)}`, error);
    }
  }
}
