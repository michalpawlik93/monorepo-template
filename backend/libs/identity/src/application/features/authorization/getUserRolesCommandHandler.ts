import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { BaseCommand, BasicError, Envelope, Handler, Result, isErr, ok } from '@app/core';
import { IUserRoleRepository, USER_ROLE_REPOSITORY_KEY } from '../../../domain';

export const GET_USER_ROLES_COMMAND_TYPE = 'identity.getUserRoles';

export interface GetUserRolesCommand extends BaseCommand {
  userId: string;
}

@injectable()
export class GetUserRolesCommandHandler
  implements Handler<GetUserRolesCommand, string[]>
{
  constructor(
    @inject(USER_ROLE_REPOSITORY_KEY)
    private readonly userRoleRepository: IUserRoleRepository,
  ) {}

  async handle(
    env: Envelope<GetUserRolesCommand>,
  ): Promise<Result<string[], BasicError>> {
    const rolesResult = await this.userRoleRepository.findRolesByUserId(
      env.payload.userId,
    );

    if (isErr(rolesResult)) {
      return rolesResult;
    }

    return ok(rolesResult.value.map((role) => role.name));
  }
}
