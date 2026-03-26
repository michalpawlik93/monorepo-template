import { BasicError, Result } from '@app/core';
import { Permission } from '../models';

export interface IPermissionRepository {
  findById: (id: string) => Promise<Result<Permission, BasicError>>;
  findByName: (name: string) => Promise<Result<Permission, BasicError>>;
  findAll: () => Promise<Result<Permission[], BasicError>>;
  create: (data: Pick<Permission, 'name' | 'description'>) => Promise<Result<Permission, BasicError>>;
}

export const PERMISSION_REPOSITORY_KEY = Symbol.for('PermissionRepository');
