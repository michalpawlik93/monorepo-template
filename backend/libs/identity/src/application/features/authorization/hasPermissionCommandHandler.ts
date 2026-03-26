import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { BaseCommand, BasicError, Envelope, Handler, Result, isErr, ok } from '@app/core';
import { IUserRoleRepository, USER_ROLE_REPOSITORY_KEY } from '../../../domain';

export const HAS_PERMISSION_COMMAND_TYPE = 'identity.hasPermission';

export interface HasPermissionCommand extends BaseCommand {
  userId: string;
  permission: string;
}

@injectable()
export class HasPermissionCommandHandler
  implements Handler<HasPermissionCommand, boolean>
{
  constructor(
    @inject(USER_ROLE_REPOSITORY_KEY)
    private readonly userRoleRepository: IUserRoleRepository,
  ) {}

  async handle(
    env: Envelope<HasPermissionCommand>,
  ): Promise<Result<boolean, BasicError>> {
    const permissionsResult = await this.userRoleRepository.getEffectivePermissions(
      env.payload.userId,
    );

    if (isErr(permissionsResult)) {
      return permissionsResult;
    }

    return ok(permissionsResult.value.includes(env.payload.permission));
  }
}
