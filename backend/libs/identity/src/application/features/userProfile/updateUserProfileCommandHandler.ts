import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { BaseCommand, BasicError, Envelope, Handler, Result } from '@app/core';
import { IUserProfileRepository, USER_PROFILE_REPOSITORY_KEY } from '../../../domain';
import { User } from '../../../domain';

export const UPDATE_USER_PROFILE_COMMAND_TYPE = 'identity.updateUserProfile';

export interface UpdateUserProfileCommand extends BaseCommand {
  userId: string;
  email?: string;
  lastLoginAt?: Date;
}

@injectable()
export class UpdateUserProfileCommandHandler
  implements Handler<UpdateUserProfileCommand, User>
{
  constructor(
    @inject(USER_PROFILE_REPOSITORY_KEY)
    private readonly userProfileRepository: IUserProfileRepository,
  ) {}

  async handle(
    env: Envelope<UpdateUserProfileCommand>,
  ): Promise<Result<User, BasicError>> {
    return this.userProfileRepository.update(env.payload.userId, {
      email: env.payload.email,
      lastLoginAt: env.payload.lastLoginAt,
    });
  }
}
