import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { BaseCommand, BasicError, Envelope, Handler, Result, isErr, ok } from '@app/core';
import {
  IRoleRepository,
  IUserRoleRepository,
  ROLE_REPOSITORY_KEY,
  USER_ROLE_REPOSITORY_KEY,
} from '../../../domain';

export const ASSIGN_ROLE_COMMAND_TYPE = 'identity.assignRole';

export interface AssignRoleCommand extends BaseCommand {
  userId: string;
  roleName: string;
}

@injectable()
export class AssignRoleCommandHandler implements Handler<AssignRoleCommand, null> {
  constructor(
    @inject(ROLE_REPOSITORY_KEY)
    private readonly roleRepository: IRoleRepository,
    @inject(USER_ROLE_REPOSITORY_KEY)
    private readonly userRoleRepository: IUserRoleRepository,
  ) {}

  async handle(
    env: Envelope<AssignRoleCommand>,
  ): Promise<Result<null, BasicError>> {
    const roleResult = await this.roleRepository.findByName(env.payload.roleName);
    if (isErr(roleResult)) {
      return roleResult;
    }

    const assignResult = await this.userRoleRepository.assignRole(
      env.payload.userId,
      roleResult.value.id,
    );
    if (isErr(assignResult)) {
      return assignResult;
    }

    return ok(null);
  }
}
