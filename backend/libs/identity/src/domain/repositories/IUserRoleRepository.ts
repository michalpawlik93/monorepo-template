import { BasicError, Result } from '@app/core';
import { Role } from '../models';

export interface IUserRoleRepository {
  findRolesByUserId: (userId: string) => Promise<Result<Role[], BasicError>>;
  assignRole: (userId: string, roleId: string) => Promise<Result<null, BasicError>>;
  removeRole: (userId: string, roleId: string) => Promise<Result<null, BasicError>>;
  getEffectivePermissions: (userId: string) => Promise<Result<string[], BasicError>>;
}

export const USER_ROLE_REPOSITORY_KEY = Symbol.for('UserRoleRepository');
