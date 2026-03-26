import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { BaseCommand, BasicError, Envelope, Handler, Result } from '@app/core';
import { IUserProfileRepository, USER_PROFILE_REPOSITORY_KEY } from '../../../domain';
import { User } from '../../../domain';

export const GET_USER_PROFILE_COMMAND_TYPE = 'identity.getUserProfile';

export interface GetUserProfileCommand extends BaseCommand {
  userId: string;
}

@injectable()
export class GetUserProfileCommandHandler
  implements Handler<GetUserProfileCommand, User>
{
  constructor(
    @inject(USER_PROFILE_REPOSITORY_KEY)
    private readonly userProfileRepository: IUserProfileRepository,
  ) {}

  async handle(
    env: Envelope<GetUserProfileCommand>,
  ): Promise<Result<User, BasicError>> {
    return this.userProfileRepository.findById(env.payload.userId);
  }
}
