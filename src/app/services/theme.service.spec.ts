import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ThemeService } from './theme.service';
import { flushStoreLoads, signIn, TEST_SETTINGS } from '../testing/session';

describe('ThemeService', () => {
  let originalLocalCopy: string | null;
  let originalBodyTheme: string | null;
  let http: HttpTestingController;

  beforeEach(() => {
    originalLocalCopy = localStorage.getItem('theme');
    originalBodyTheme = document.body.getAttribute('data-theme');
    localStorage.removeItem('theme');
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.removeItem('budget_session_token');
    if (originalLocalCopy === null) localStorage.removeItem('theme');
    else localStorage.setItem('theme', originalLocalCopy);
    if (originalBodyTheme === null) document.body.removeAttribute('data-theme');
    else document.body.setAttribute('data-theme', originalBodyTheme);
  });

  it('defaults to light before anything is known', () => {
    const service = TestBed.inject(ThemeService);
    TestBed.flushEffects();
    expect(service.theme()).toBe('light');
    expect(document.body.getAttribute('data-theme')).toBe('light');
  });

  it('applies the local copy immediately, before the account settings load', () => {
    localStorage.setItem('theme', 'dark');
    const service = TestBed.inject(ThemeService);
    TestBed.flushEffects();
    expect(service.theme()).toBe('dark');
    expect(document.body.getAttribute('data-theme')).toBe('dark');
  });

  it('switches to the account\'s theme once settings load, and remembers it locally', () => {
    const service = TestBed.inject(ThemeService);
    signIn();
    flushStoreLoads({ settings: { theme: 'dark' } });
    TestBed.flushEffects();

    expect(service.theme()).toBe('dark');
    expect(document.body.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('toggling saves the theme to the account', () => {
    const service = TestBed.inject(ThemeService);
    signIn();
    flushStoreLoads();

    service.toggle();
    const req = http.expectOne(r => r.method === 'PUT' && r.url === '/api/budget-tracker/settings');
    expect(req.request.body).toEqual({ theme: 'dark' });
    req.flush({ ...TEST_SETTINGS, theme: 'dark' });
    TestBed.flushEffects();

    expect(service.theme()).toBe('dark');
    expect(document.body.getAttribute('data-theme')).toBe('dark');
  });
});
