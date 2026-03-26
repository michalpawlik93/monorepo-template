import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { BaseCommand, BasicError, Envelope, Handler, Result, isErr, ok } from '@app/core';
import {
  IRoleRepository,
  IUserRoleRepository,
  ROLE_REPOSITORY_KEY,
  USER_ROLE_REPOSITORY_KEY,
} from '../../../domain';

export const REMOVE_ROLE_COMMAND_TYPE = 'identity.removeRole';

export interface RemoveRoleCommand extends BaseCommand {
  userId: string;
  roleName: string;
}

@injectable()
export class RemoveRoleCommandHandler implements Handler<RemoveRoleCommand, null> {
  constructor(
    @inject(ROLE_REPOSITORY_KEY)
    private readonly roleRepository: IRoleRepository,
    @inject(USER_ROLE_REPOSITORY_KEY)
    private readonly userRoleRepository: IUserRoleRepository,
  ) {}

  async handle(
    env: Envelope<RemoveRoleCommand>,
  ): Promise<Result<null, BasicError>> {
    const roleResult = await this.roleRepository.findByName(env.payload.roleName);
    if (isErr(roleResult)) {
      return roleResult;
    }

    const removeResult = await this.userRoleRepository.removeRole(
      env.payload.userId,
      roleResult.value.id,
    );
    if (isErr(removeResult)) {
      return removeResult;
    }

    return ok(null);
  }
}
