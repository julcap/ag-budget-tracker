export interface User {
  id: number;
  username: string;
  email: string | null;
  is_admin: boolean;
  totp_enabled: boolean;
}

/** Admin view of an account. */
export interface ManagedUser extends User {
  is_verified: boolean;
  created_at: string;
}

/** What the API returns once a password or email code is proven. */
export type AuthResponse =
  | { token: string; user: User }
  | { totpRequired: true; challengeToken: string };
