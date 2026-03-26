import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { BasicError, Result, ok, unauthorizedErr } from '@app/core';
import { createUser, User } from '../../domain';
import { SupabaseConfig } from './config';

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt?: number;
}

export type AuthenticatedUser = User;

export interface AuthenticationResult {
  user: AuthenticatedUser;
  session: AuthSession;
}

export interface IAuthenticationService {
  register: (payload: { email: string; password: string }) => Promise<Result<AuthenticatedUser, BasicError>>;
  login: (payload: { email: string; password: string }) => Promise<Result<AuthenticationResult, BasicError>>;
  logout: (payload: { userId: string }) => Promise<Result<null, BasicError>>;
  getCurrentUser: (payload: { accessToken: string }) => Promise<Result<AuthenticatedUser, BasicError>>;
  refreshToken: (payload: { refreshToken: string }) => Promise<Result<AuthSession, BasicError>>;
}

const toAuthError = (message: string, cause?: unknown): Result<never, BasicError> => {
  void cause;
  return unauthorizedErr(message);
};

const toSession = (session: {
  access_token: string;
  refresh_token: string;
  expires_at?: number | null;
}): AuthSession => ({
  accessToken: session.access_token,
  refreshToken: session.refresh_token,
  expiresAt: session.expires_at ?? undefined,
});

export class SupabaseAuthenticationService implements IAuthenticationService {
  private readonly client: SupabaseClient;

  constructor(private readonly config: SupabaseConfig) {
    this.client = this.createClient();
  }

  private createClient(): SupabaseClient {
    return createClient(this.config.url, this.config.serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  async register(payload: {
    email: string;
    password: string;
  }): Promise<Result<AuthenticatedUser, BasicError>> {
    const response = await this.client.auth.signUp({
      email: payload.email,
      password: payload.password,
    });

    if (response.error) {
      return toAuthError(`Failed to register user: ${response.error.message}`, response.error);
    }

    const user = response.data.user;
    if (!user || !user.email) {
      return toAuthError('Supabase did not return user data after registration');
    }

    return ok(
      createUser({
        id: user.id,
        email: user.email,
        createdAt: user.created_at ? new Date(user.created_at) : new Date(),
        lastLoginAt: user.last_sign_in_at ? new Date(user.last_sign_in_at) : undefined,
      }),
    );
  }

  async login(payload: {
    email: string;
    password: string;
  }): Promise<Result<AuthenticationResult, BasicError>> {
    const response = await this.client.auth.signInWithPassword({
      email: payload.email,
      password: payload.password,
    });

    if (response.error) {
      return toAuthError(`Failed to login user: ${response.error.message}`, response.error);
    }

    const user = response.data.user;
    const session = response.data.session;

    if (!user || !user.email || !session) {
      return toAuthError('Supabase did not return complete login data');
    }

    return ok({
      user: createUser({
        id: user.id,
        email: user.email,
        createdAt: user.created_at ? new Date(user.created_at) : new Date(),
        lastLoginAt: user.last_sign_in_at ? new Date(user.last_sign_in_at) : undefined,
      }),
      session: toSession(session),
    });
  }

  async logout(payload: { userId: string }): Promise<Result<null, BasicError>> {
    const response = await this.client.auth.admin.signOut(payload.userId);
    if (response.error) {
      return toAuthError(`Failed to logout user: ${response.error.message}`, response.error);
    }

    return ok(null);
  }

  async getCurrentUser(payload: {
    accessToken: string;
  }): Promise<Result<AuthenticatedUser, BasicError>> {
    const response = await this.client.auth.getUser(payload.accessToken);

    if (response.error) {
      return toAuthError(`Failed to fetch current user: ${response.error.message}`, response.error);
    }

    const user = response.data.user;
    if (!user || !user.email) {
      return toAuthError('Supabase did not return current user data');
    }

    return ok(
      createUser({
        id: user.id,
        email: user.email,
        createdAt: user.created_at ? new Date(user.created_at) : new Date(),
        lastLoginAt: user.last_sign_in_at ? new Date(user.last_sign_in_at) : undefined,
      }),
    );
  }

  async refreshToken(payload: {
    refreshToken: string;
  }): Promise<Result<AuthSession, BasicError>> {
    const response = await this.client.auth.refreshSession({
      refresh_token: payload.refreshToken,
    });

    if (response.error) {
      return toAuthError(`Failed to refresh token: ${response.error.message}`, response.error);
    }

    const session = response.data.session;
    if (!session) {
      return toAuthError('Supabase did not return a session on refresh');
    }

    return ok(toSession(session));
  }
}
