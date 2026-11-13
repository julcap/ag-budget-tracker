import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'budget_session';

// Demo-only auth: any credentials sign in. The session survives reloads via localStorage.
@Injectable({ providedIn: 'root' })
export class AuthService {
  private _isAuthenticated = signal(this.readSession());
  readonly isAuthenticated = this._isAuthenticated.asReadonly();

  login() {
    this._isAuthenticated.set(true);
    this.writeSession(true);
  }

  logout() {
    this._isAuthenticated.set(false);
    this.writeSession(false);
  }

  private readSession(): boolean {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'active';
    } catch {
      return false;
    }
  }

  private writeSession(active: boolean) {
    try {
      if (active) localStorage.setItem(STORAGE_KEY, 'active');
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Without storage the session simply ends on reload.
    }
  }
}
