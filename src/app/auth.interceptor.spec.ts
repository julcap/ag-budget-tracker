import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './services/auth.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  const token = signal<string | null>('abc');
  const auth = { token, logout: jasmine.createSpy('logout') };

  beforeEach(() => {
    token.set('abc');
    auth.logout.calls.reset();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: auth }
      ]
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('adds the bearer token to API calls only', () => {
    http.get('/api/budget-tracker/transactions').subscribe();
    http.get('https://example.com/other').subscribe();
    const apiCall = backend.expectOne('/api/budget-tracker/transactions').request;
    expect(apiCall.headers.get('Authorization')).toBe('Bearer abc');
    expect(apiCall.headers.get('X-App-Name')).toBe('budget-tracker');
    expect(backend.expectOne('https://example.com/other').request.headers.has('Authorization')).toBeFalse();
  });

  it('identifies the app even before sign-in', () => {
    token.set(null);
    http.post('/api/auth/login', {}).subscribe();
    const req = backend.expectOne('/api/auth/login').request;
    expect(req.headers.get('X-App-Name')).toBe('budget-tracker');
    expect(req.headers.has('Authorization')).toBeFalse();
  });

  it('signs out when the server reports the session is invalid', () => {
    http.get('/api/auth/me').subscribe({ error: () => {} });
    backend.expectOne('/api/auth/me').flush({ code: 'UNAUTHENTICATED' }, { status: 401, statusText: 'Unauthorized' });
    expect(auth.logout).toHaveBeenCalled();
  });

  it('leaves other 401s (e.g. wrong current password) to the caller', () => {
    http.put('/api/auth/password', {}).subscribe({ error: () => {} });
    backend.expectOne('/api/auth/password').flush({ error: 'Current password is incorrect' }, { status: 401, statusText: 'Unauthorized' });
    expect(auth.logout).not.toHaveBeenCalled();
  });
});
