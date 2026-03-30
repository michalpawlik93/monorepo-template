import type {
  LoginResponseContract,
  SessionContract,
  UserPrincipalContract,
} from '@app/integration-contracts';

export const mockPrincipal = (
  overrides: Partial<UserPrincipalContract> = {},
): UserPrincipalContract => ({
  userId: 'user-1',
  email: 'john@example.com',
  roles: ['user'],
  permissions: ['products.read'],
  ...overrides,
});

export const mockSession = (
  overrides: Partial<SessionContract> = {},
): SessionContract => ({
  accessToken: 'access-token-1',
  refreshToken: 'refresh-token-1',
  expiresAt: 1735689600,
  ...overrides,
});

export const mockLoginResponse = (
  overrides: Partial<LoginResponseContract> = {},
): LoginResponseContract => ({
  session: mockSession(),
  principal: mockPrincipal(),
  ...overrides,
});
