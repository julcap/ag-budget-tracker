import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { firstValueFrom, Observable, of } from 'rxjs';
import { adminGuard, authGuard, guestGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';
import { User } from '../models/user';

describe('route guards', () => {
  let currentUser: User | null;

  const run = (guard: typeof authGuard) =>
    firstValueFrom(TestBed.runInInjectionContext(() => guard({} as any, {} as any)) as Observable<boolean | UrlTree>);
  const path = (result: boolean | UrlTree) => (result instanceof UrlTree ? TestBed.inject(Router).serializeUrl(result) : result);

  beforeEach(() => {
    currentUser = null;
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: { ensureUser: () => of(currentUser) } }]
    });
  });

  it('authGuard sends signed-out visitors to the sign-in page', async () => {
    expect(path(await run(authGuard))).toBe('/login');
    currentUser = { id: 1, username: 'sam', email: null, is_admin: false, totp_enabled: false };
    expect(await run(authGuard)).toBeTrue();
  });

  it('adminGuard only admits administrators', async () => {
    expect(path(await run(adminGuard))).toBe('/login');
    currentUser = { id: 1, username: 'sam', email: null, is_admin: false, totp_enabled: false };
    expect(path(await run(adminGuard))).toBe('/dashboard');
    currentUser = { ...currentUser, is_admin: true };
    expect(await run(adminGuard)).toBeTrue();
  });

  it('guestGuard sends signed-in users into the app', async () => {
    expect(await run(guestGuard)).toBeTrue();
    currentUser = { id: 1, username: 'sam', email: null, is_admin: false, totp_enabled: false };
    expect(path(await run(guestGuard))).toBe('/dashboard');
  });
});
