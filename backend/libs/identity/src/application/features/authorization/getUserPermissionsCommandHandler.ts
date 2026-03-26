import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { BaseCommand, BasicError, Envelope, Handler, Result, isErr, ok } from '@app/core';
import { IUserRoleRepository, USER_ROLE_REPOSITORY_KEY } from '../../../domain';

export const GET_USER_PERMISSIONS_COMMAND_TYPE = 'identity.getUserPermissions';

export interface GetUserPermissionsCommand extends BaseCommand {
  userId: string;
}

@injectable()
export class GetUserPermissionsCommandHandler
  implements Handler<GetUserPermissionsCommand, string[]>
{
  constructor(
    @inject(USER_ROLE_REPOSITORY_KEY)
    private readonly userRoleRepository: IUserRoleRepository,
  ) {}

  async handle(
    env: Envelope<GetUserPermissionsCommand>,
  ): Promise<Result<string[], BasicError>> {
    const permissionsResult = await this.userRoleRepository.getEffectivePermissions(
      env.payload.userId,
    );

    if (isErr(permissionsResult)) {
      return permissionsResult;
    }

    return ok(permissionsResult.value);
  }
}
