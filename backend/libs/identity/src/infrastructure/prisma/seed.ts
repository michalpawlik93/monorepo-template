import { isErr } from '@app/core';
import { BASE_ACCESS_ROLE } from '../../domain';
import { IPermissionRepository, IRoleRepository } from '../../domain';
import { identityDb } from './tx';

export const seedIdentityDefaults = async (
  roleRepository: IRoleRepository,
  permissionRepository: IPermissionRepository,
): Promise<void> => {
  const permissions = [
    'products.read',
    'products.edit',
    'products.publish',
    'products.admin',
  ];

  for (const permissionName of permissions) {
    const existing = await permissionRepository.findByName(permissionName);
    if (isErr(existing)) {
      await permissionRepository.create({
        name: permissionName,
        description: `Permission ${permissionName}`,
      });
    }
  }

  const baseRole = await roleRepository.findByName(BASE_ACCESS_ROLE);
  const resolvedBaseRole = isErr(baseRole)
    ? await roleRepository.create({ name: BASE_ACCESS_ROLE, description: 'Default role for every user' })
    : baseRole;

  if (isErr(resolvedBaseRole)) {
    return;
  }

  const adminRole = await roleRepository.findByName('admin');
  const resolvedAdminRole = isErr(adminRole)
    ? await roleRepository.create({ name: 'admin', description: 'Administrative role' })
    : adminRole;

  if (isErr(resolvedAdminRole)) {
    return;
  }

  const db = identityDb();
  const permissionRecords = await db.permission.findMany({
    where: {
      name: {
        in: permissions,
      },
    },
  });

  const byName = new Map(permissionRecords.map((p) => [p.name, p.id]));
  const link = async (roleId: string, permissionName: string) => {
    const permissionId = byName.get(permissionName);
    if (!permissionId) {
      return;
    }

    await db.rolePermission.upsert({
      where: { roleId_permissionId: { roleId, permissionId } },
      create: { roleId, permissionId },
      update: {},
    });
  };

  await link(resolvedBaseRole.value.id, 'products.read');
  await link(resolvedAdminRole.value.id, 'products.read');
  await link(resolvedAdminRole.value.id, 'products.edit');
  await link(resolvedAdminRole.value.id, 'products.publish');
  await link(resolvedAdminRole.value.id, 'products.admin');
};
