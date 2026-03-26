import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { BaseCommand, BasicError, Envelope, Handler, Result, isErr, ok } from '@app/core';
import { IUserRoleRepository, USER_ROLE_REPOSITORY_KEY } from '../../../domain';
import { AUTH_SERVICE_TOKEN, IAuthenticationService } from '../../../infrastructure/supabase';
import { resolveUserRolesAndPermissions } from './resolveUserRolesAndPermissions';

export const GET_CURRENT_USER_COMMAND_TYPE = 'identity.getCurrentUser';

export interface GetCurrentUserCommand extends BaseCommand {
  accessToken: string;
}

export interface GetCurrentUserResponse {
  userId: string;
  email: string;
  roles: string[];
  permissions: string[];
}

@injectable()
export class GetCurrentUserCommandHandler
  implements Handler<GetCurrentUserCommand, GetCurrentUserResponse>
{
  constructor(
    @inject(AUTH_SERVICE_TOKEN)
    private readonly authService: IAuthenticationService,
    @inject(USER_ROLE_REPOSITORY_KEY)
    private readonly userRoleRepository: IUserRoleRepository,
  ) {}

  async handle(
    env: Envelope<GetCurrentUserCommand>,
  ): Promise<Result<GetCurrentUserResponse, BasicError>> {
    const userResult = await this.authService.getCurrentUser({
      accessToken: env.payload.accessToken,
    });

    if (isErr(userResult)) {
      return userResult;
    }

    const principalResult = await resolveUserRolesAndPermissions({
      userId: userResult.value.id,
      email: userResult.value.email,
      userRoleRepository: this.userRoleRepository,
    });
    if (isErr(principalResult)) {
      return principalResult;
    }

    const principal = principalResult.value;

    return ok({
      userId: principal.userId,
      email: principal.email,
      roles: principal.roles,
      permissions: principal.permissions,
    });
  }
}
