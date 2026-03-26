import { BasicError, Result, isErr, ok } from '@app/core';
import { createUserPrincipal, IUserRoleRepository, UserPrincipal } from '../../../domain';

export const resolveUserRolesAndPermissions = async (params: {
  userId: string;
  email: string;
  userRoleRepository: IUserRoleRepository;
}): Promise<Result<UserPrincipal, BasicError>> => {
  const rolesResult = await params.userRoleRepository.findRolesByUserId(params.userId);
  if (isErr(rolesResult)) {
    return rolesResult;
  }

  const permissionsResult = await params.userRoleRepository.getEffectivePermissions(params.userId);
  if (isErr(permissionsResult)) {
    return permissionsResult;
  }

  return ok(
    createUserPrincipal({
      userId: params.userId,
      email: params.email,
      roles: rolesResult.value.map((role) => role.name),
      permissions: permissionsResult.value,
    }),
  );
};
