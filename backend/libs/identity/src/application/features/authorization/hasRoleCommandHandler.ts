import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { BaseCommand, BasicError, Envelope, Handler, Result, isErr, ok } from '@app/core';
import { IUserRoleRepository, USER_ROLE_REPOSITORY_KEY } from '../../../domain';

export const HAS_ROLE_COMMAND_TYPE = 'identity.hasRole';

export interface HasRoleCommand extends BaseCommand {
  userId: string;
  role: string;
}

@injectable()
export class HasRoleCommandHandler implements Handler<HasRoleCommand, boolean> {
  constructor(
    @inject(USER_ROLE_REPOSITORY_KEY)
    private readonly userRoleRepository: IUserRoleRepository,
  ) {}

  async handle(
    env: Envelope<HasRoleCommand>,
  ): Promise<Result<boolean, BasicError>> {
    const rolesResult = await this.userRoleRepository.findRolesByUserId(env.payload.userId);
    if (isErr(rolesResult)) {
      return rolesResult;
    }

    return ok(rolesResult.value.some((role) => role.name === env.payload.role));
  }
}
