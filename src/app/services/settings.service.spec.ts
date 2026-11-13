import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { SettingsService } from './settings.service';
import { flushStoreLoads, signIn, signOut, TEST_SETTINGS } from '../testing/session';

describe('SettingsService', () => {
  let service: SettingsService;
  let http: HttpTestingController;
  const API = '/api/budget-tracker/settings';

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(SettingsService);
    signIn();
    flushStoreLoads({ settings: { currency: 'EUR' } });
  });

  afterEach(() => {
    http.verify();
    localStorage.removeItem('budget_session_token');
  });

  it('loads the account\'s settings on sign-in', () => {
    expect(service.loaded()).toBeTrue();
    expect(service.currency()).toBe('EUR');
    expect(service.spendingDangerPercent()).toBe(100);
  });

  it('saves partial changes and takes the server\'s merged result', () => {
    service.update({ currency: 'DKK' });
    const req = http.expectOne(r => r.method === 'PUT' && r.url === API);
    expect(req.request.body).toEqual({ currency: 'DKK' });
    expect(service.currency()).toBe('EUR');
    req.flush({ ...TEST_SETTINGS, currency: 'DKK' });
    expect(service.currency()).toBe('DKK');
  });

  it('clamps thresholds and ignores non-numbers', () => {
    service.setThreshold('spendingDangerPercent', -10);
    expect(http.expectOne(API).request.body).toEqual({ spendingDangerPercent: 0 });
    service.setThreshold('spendingDangerPercent', NaN);
    http.expectNone(API);
  });

  it('resets only the thresholds', () => {
    service.resetThresholds();
    expect(http.expectOne(API).request.body).toEqual({
      spendingWarningPercent: 50, spendingWarningIconPercent: 75, spendingDangerPercent: 100
    });
  });

  it('reports a failed save and keeps the previous values', () => {
    service.update({ currency: 'DKK' });
    http.expectOne(API).flush({ error: 'nope' }, { status: 500, statusText: 'Server Error' });
    expect(service.currency()).toBe('EUR');
    expect(service.error()).toContain('Could not save');
  });

  it('returns to defaults on sign-out', () => {
    signOut();
    expect(service.loaded()).toBeFalse();
    expect(service.currency()).toBe('USD');
  });
});
