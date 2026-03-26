import { BasicError, Result } from '@app/core';
import { Role } from '../models';

export interface IRoleRepository {
  findById: (id: string) => Promise<Result<Role, BasicError>>;
  findByName: (name: string) => Promise<Result<Role, BasicError>>;
  findAll: () => Promise<Result<Role[], BasicError>>;
  create: (data: Pick<Role, 'name' | 'description'>) => Promise<Result<Role, BasicError>>;
}

export const ROLE_REPOSITORY_KEY = Symbol.for('RoleRepository');
