import { injectable } from 'inversify';
import { BasicError, Result, basicErr, getErrorMessage, notFoundErr, ok } from '@app/core';
import { IUserProfileRepository, User } from '../../domain';
import { identityDb } from './tx';

const toDomain = (record: {
  id: string;
  email: string;
  createdAt: Date;
  lastLoginAt: Date | null;
}): User => ({
  id: record.id,
  email: record.email,
  createdAt: record.createdAt,
  lastLoginAt: record.lastLoginAt ?? undefined,
});

@injectable()
export class UserProfileRepository implements IUserProfileRepository {
  private get db() {
    return identityDb();
  }

  async findById(id: string): Promise<Result<User, BasicError>> {
    try {
      const user = await this.db.userProfile.findUnique({ where: { id } });
      if (!user) {
        return notFoundErr(`User profile with id ${id} not found`);
      }
      return ok(toDomain(user));
    } catch (error) {
      return basicErr(`Failed to find user profile ${id}: ${getErrorMessage(error)}`, error);
    }
  }

  async create(data: User): Promise<Result<User, BasicError>> {
    try {
      const created = await this.db.userProfile.create({
        data: {
          id: data.id,
          email: data.email,
          createdAt: data.createdAt,
          lastLoginAt: data.lastLoginAt,
        },
      });
      return ok(toDomain(created));
    } catch (error) {
      return basicErr(`Failed to create user profile ${data.id}: ${getErrorMessage(error)}`, error);
    }
  }

  async update(
    id: string,
    data: Partial<Pick<User, 'email' | 'lastLoginAt'>>,
  ): Promise<Result<User, BasicError>> {
    try {
      const updated = await this.db.userProfile.update({
        where: { id },
        data: {
          email: data.email,
          lastLoginAt: data.lastLoginAt,
        },
      });
      return ok(toDomain(updated));
    } catch (error) {
      return basicErr(`Failed to update user profile ${id}: ${getErrorMessage(error)}`, error);
    }
  }
}
