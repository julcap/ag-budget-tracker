import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  beforeEach(() => {
    localStorage.removeItem('budget_session');
    TestBed.configureTestingModule({});
  });

  afterEach(() => localStorage.removeItem('budget_session'));

  it('starts signed out', () => {
    expect(TestBed.inject(AuthService).isAuthenticated()).toBeFalse();
  });

  it('keeps the session across reloads until logout', () => {
    TestBed.inject(AuthService).login();
    expect(new AuthService().isAuthenticated()).toBeTrue();

    TestBed.inject(AuthService).logout();
    expect(new AuthService().isAuthenticated()).toBeFalse();
  });
});
