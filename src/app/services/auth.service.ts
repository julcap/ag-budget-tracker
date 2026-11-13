import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, finalize, map, Observable, of, shareReplay, tap } from 'rxjs';
import { AuthResponse, User } from '../models/user';
import { environment } from '../../environments/environment';

const TOKEN_KEY = 'budget_session_token';
const API = `${environment.apiUrl}/auth`;

export type SignInOutcome = 'signed-in' | 'totp-required';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private _token = signal<string | null>(readToken());
  private _user = signal<User | null>(null);
  private loading$: Observable<User | null> | null = null;

  readonly token = this._token.asReadonly();
  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);
  readonly isAdmin = computed(() => this._user()?.is_admin ?? false);
  /** Set when a sign-in step proved the password/email code but the account also needs a TOTP code. */
  readonly pendingChallenge = signal<string | null>(null);

  /** Resolves the signed-in user, fetching it once per page load if only a stored token exists. */
  ensureUser(): Observable<User | null> {
    if (this._user()) return of(this._user());
    if (!this._token()) return of(null);
    this.loading$ ??= this.http.get<User>(`${API}/me`).pipe(
      tap(user => this._user.set(user)),
      catchError(() => {
        this.clearSession();
        return of(null);
      }),
      finalize(() => (this.loading$ = null)),
      shareReplay(1)
    );
    return this.loading$;
  }

  login(username: string, password: string): Observable<SignInOutcome> {
    return this.http.post<AuthResponse>(`${API}/login`, { username, password }).pipe(map(r => this.handleAuthResponse(r)));
  }

  completeTotp(code: string): Observable<SignInOutcome> {
    return this.http
      .post<AuthResponse>(`${API}/totp/login`, { challengeToken: this.pendingChallenge(), code })
      .pipe(map(r => this.handleAuthResponse(r)));
  }

  registrationEnabled(): Observable<boolean> {
    return this.http.get<{ enabled: boolean }>(`${API}/registration-status`).pipe(map(r => r.enabled));
  }

  register(username: string, email: string, password: string): Observable<unknown> {
    return this.http.post(`${API}/register`, { username, email, password });
  }

  verifyEmail(email: string, code: string): Observable<SignInOutcome> {
    return this.http.post<AuthResponse>(`${API}/verify-code`, { email, code }).pipe(map(r => this.handleAuthResponse(r)));
  }

  resendVerification(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${API}/resend-code`, { email });
  }

  requestPasswordReset(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${API}/forgot-password`, { email });
  }

  resetPassword(email: string, code: string, newPassword: string): Observable<SignInOutcome> {
    return this.http
      .post<AuthResponse>(`${API}/reset-password`, { email, code, newPassword })
      .pipe(map(r => this.handleAuthResponse(r)));
  }

  updateUser(changes: Partial<User>) {
    this._user.update(user => (user ? { ...user, ...changes } : user));
  }

  /** Ends the session; per-user stores clear themselves (see whenSignedIn). */
  logout() {
    // Best effort, so the server can record the logout; the session ends locally either way.
    if (this._token()) this.http.post(`${API}/logout`, {}).subscribe({ error: () => {} });
    this.clearSession();
    this.router.navigate(['/login']);
  }

  private handleAuthResponse(response: AuthResponse): SignInOutcome {
    if ('totpRequired' in response) {
      this.pendingChallenge.set(response.challengeToken);
      return 'totp-required';
    }
    this.pendingChallenge.set(null);
    writeToken(response.token);
    this._token.set(response.token);
    this._user.set(response.user);
    return 'signed-in';
  }

  private clearSession() {
    writeToken(null);
    this._token.set(null);
    this._user.set(null);
    this.pendingChallenge.set(null);
  }
}

function readToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function writeToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Without storage the session lasts until the page is reloaded.
  }
}

/** Where to go once a sign-in step succeeds: straight in, or on to the authenticator code. */
export function signInTarget(outcome: SignInOutcome): string[] {
  return outcome === 'totp-required' ? ['/two-factor'] : ['/dashboard'];
}
