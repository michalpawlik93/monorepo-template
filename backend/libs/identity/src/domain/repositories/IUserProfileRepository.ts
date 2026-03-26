import { BasicError, Result } from '@app/core';
import { User } from '../models';

export interface IUserProfileRepository {
  findById: (id: string) => Promise<Result<User, BasicError>>;
  create: (data: User) => Promise<Result<User, BasicError>>;
  update: (id: string, data: Partial<Pick<User, 'email' | 'lastLoginAt'>>) => Promise<Result<User, BasicError>>;
}

export const USER_PROFILE_REPOSITORY_KEY = Symbol.for('UserProfileRepository');
