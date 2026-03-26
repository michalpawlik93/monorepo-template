import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { BaseCommand, BasicError, Envelope, Handler, Result, isErr, ok } from '@app/core';
import { IUserRoleRepository, USER_ROLE_REPOSITORY_KEY } from '../../../domain';
import { AUTH_SERVICE_TOKEN, IAuthenticationService } from '../../../infrastructure/supabase';
import { resolveUserRolesAndPermissions } from './resolveUserRolesAndPermissions';

export const LOGIN_COMMAND_TYPE = 'identity.login';

export interface LoginCommand extends BaseCommand {
  email: string;
  password: string;
}

export interface LoginResponse {
  session: {
    accessToken: string;
    refreshToken: string;
    expiresAt?: number;
  };
  principal: {
    userId: string;
    email: string;
    roles: string[];
    permissions: string[];
  };
}

@injectable()
export class LoginCommandHandler implements Handler<LoginCommand, LoginResponse> {
  constructor(
    @inject(AUTH_SERVICE_TOKEN)
    private readonly authService: IAuthenticationService,
    @inject(USER_ROLE_REPOSITORY_KEY)
    private readonly userRoleRepository: IUserRoleRepository,
  ) {}

  async handle(
    env: Envelope<LoginCommand>,
  ): Promise<Result<LoginResponse, BasicError>> {
    const loginResult = await this.authService.login({
      email: env.payload.email,
      password: env.payload.password,
    });
    if (isErr(loginResult)) {
      return loginResult;
    }

    const principalResult = await resolveUserRolesAndPermissions({
      userId: loginResult.value.user.id,
      email: loginResult.value.user.email,
      userRoleRepository: this.userRoleRepository,
    });
    if (isErr(principalResult)) {
      return principalResult;
    }

    const principal = principalResult.value;

    return ok({
      session: loginResult.value.session,
      principal: {
        userId: principal.userId,
        email: principal.email,
        roles: principal.roles,
        permissions: principal.permissions,
      },
    });
  }
}
