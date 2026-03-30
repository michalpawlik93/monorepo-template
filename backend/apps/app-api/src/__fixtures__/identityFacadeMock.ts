import type { IIdentityFacade } from '@app/integration-contracts';

export const createIdentityFacadeMock = (): jest.Mocked<
  Partial<IIdentityFacade>
> => ({
  register: jest.fn(),
  login: jest.fn(),
  logout: jest.fn(),
  refreshToken: jest.fn(),
  getCurrentUser: jest.fn(),
  hasPermission: jest.fn(),
  hasRole: jest.fn(),
  assignRole: jest.fn(),
  removeRole: jest.fn(),
  getUserPermissions: jest.fn(),
  getUserRoles: jest.fn(),
  getUserProfile: jest.fn(),
  updateUserProfile: jest.fn(),
});
