import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { BaseCommand, BasicError, Envelope, Handler, Result, isErr, ok } from '@app/core';
import { BASE_ACCESS_ROLE, createUser } from '../../../domain';
import { AUTH_SERVICE_TOKEN, IAuthenticationService } from '../../../infrastructure/supabase';
import {
  IRoleRepository,
  IUserProfileRepository,
  IUserRoleRepository,
  ROLE_REPOSITORY_KEY,
  USER_PROFILE_REPOSITORY_KEY,
  USER_ROLE_REPOSITORY_KEY,
} from '../../../domain';

export const REGISTER_COMMAND_TYPE = 'identity.register';

export interface RegisterCommand extends BaseCommand {
  email: string;
  password: string;
}

export interface RegisterResponse {
  userId: string;
  email: string;
}

@injectable()
export class RegisterCommandHandler
  implements Handler<RegisterCommand, RegisterResponse>
{
  constructor(
    @inject(AUTH_SERVICE_TOKEN)
    private readonly authService: IAuthenticationService,
    @inject(USER_PROFILE_REPOSITORY_KEY)
    private readonly userProfileRepository: IUserProfileRepository,
    @inject(ROLE_REPOSITORY_KEY)
    private readonly roleRepository: IRoleRepository,
    @inject(USER_ROLE_REPOSITORY_KEY)
    private readonly userRoleRepository: IUserRoleRepository,
  ) {}

  async handle(
    env: Envelope<RegisterCommand>,
  ): Promise<Result<RegisterResponse, BasicError>> {
    const authResult = await this.authService.register({
      email: env.payload.email,
      password: env.payload.password,
    });

    if (isErr(authResult)) {
      return authResult;
    }

    const user = createUser({
      id: authResult.value.id,
      email: authResult.value.email,
      createdAt: authResult.value.createdAt,
      lastLoginAt: authResult.value.lastLoginAt,
    });

    const profileCreateResult = await this.userProfileRepository.create(user);
    if (isErr(profileCreateResult)) {
      return profileCreateResult;
    }

    let role = await this.roleRepository.findByName(BASE_ACCESS_ROLE);
    if (isErr(role)) {
      role = await this.roleRepository.create({
        name: BASE_ACCESS_ROLE,
        description: 'Default role for authenticated users',
      });
      if (isErr(role)) {
        return role;
      }
    }

    const roleAssignResult = await this.userRoleRepository.assignRole(
      user.id,
      role.value.id,
    );
    if (isErr(roleAssignResult)) {
      return roleAssignResult;
    }

    return ok({ userId: user.id, email: user.email });
  }
}
