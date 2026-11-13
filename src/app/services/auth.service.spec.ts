import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService, signInTarget } from './auth.service';

const user = { id: 1, username: 'sam', email: 'sam@example.com', is_admin: false, totp_enabled: false };

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;
  let assign: jasmine.Spy;

  function setup() {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(AuthService);
    assign = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    http = TestBed.inject(HttpTestingController);
  }

  beforeEach(() => localStorage.removeItem('budget_session_token'));
  afterEach(() => {
    http.verify();
    localStorage.removeItem('budget_session_token');
  });

  it('starts signed out without a stored token, without calling the API', done => {
    setup();
    service.ensureUser().subscribe(result => {
      expect(result).toBeNull();
      expect(service.isAuthenticated()).toBeFalse();
      done();
    });
  });

  it('signs in, stores the token and exposes the user', () => {
    setup();
    let outcome = '';
    service.login('sam', 'password1').subscribe(o => (outcome = o));
    http.expectOne('/api/auth/login').flush({ token: 'abc', user });

    expect(outcome).toBe('signed-in');
    expect(service.user()).toEqual(user);
    expect(localStorage.getItem('budget_session_token')).toBe('abc');
  });

  it('holds a TOTP challenge without starting a session, then completes it', () => {
    setup();
    let outcome = '';
    service.login('sam', 'password1').subscribe(o => (outcome = o));
    http.expectOne('/api/auth/login').flush({ totpRequired: true, challengeToken: 'challenge' });
    expect(outcome).toBe('totp-required');
    expect(service.token()).toBeNull();
    expect(service.pendingChallenge()).toBe('challenge');

    service.completeTotp('123456').subscribe(o => (outcome = o));
    const req = http.expectOne('/api/auth/totp/login');
    expect(req.request.body).toEqual({ challengeToken: 'challenge', code: '123456' });
    req.flush({ token: 'abc', user: { ...user, totp_enabled: true } });
    expect(outcome).toBe('signed-in');
    expect(service.pendingChallenge()).toBeNull();
  });

  it('restores the user from a stored token once, sharing the request', () => {
    localStorage.setItem('budget_session_token', 'stored');
    setup();
    const results: unknown[] = [];
    service.ensureUser().subscribe(u => results.push(u));
    service.ensureUser().subscribe(u => results.push(u));
    http.expectOne('/api/auth/me').flush(user);
    expect(results).toEqual([user, user]);
  });

  it('drops an invalid stored token', () => {
    localStorage.setItem('budget_session_token', 'expired');
    setup();
    service.ensureUser().subscribe();
    http.expectOne('/api/auth/me').flush({ error: 'Please authenticate' }, { status: 401, statusText: 'Unauthorized' });
    expect(service.token()).toBeNull();
    expect(localStorage.getItem('budget_session_token')).toBeNull();
  });

  it('logs out by clearing the session and returning to the sign-in page', () => {
    setup();
    service.login('sam', 'password1').subscribe();
    http.expectOne('/api/auth/login').flush({ token: 'abc', user });

    service.logout();
    const logoutCall = http.expectOne('/api/auth/logout');
    expect(logoutCall.request.headers.get('Authorization')).toBeNull(); // no interceptor in this module
    logoutCall.flush(null);
    expect(service.user()).toBeNull();
    expect(localStorage.getItem('budget_session_token')).toBeNull();
    expect(assign).toHaveBeenCalledWith(['/login']);
  });

  it('routes each sign-in outcome to the right place', () => {
    expect(signInTarget('signed-in')).toEqual(['/dashboard']);
    expect(signInTarget('totp-required')).toEqual(['/two-factor']);
  });
});
