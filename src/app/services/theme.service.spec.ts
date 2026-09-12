import { TestBed } from '@angular/core/testing';

import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let originalStoredTheme: string | null;
  let originalBodyTheme: string | null;

  beforeEach(() => {
    originalStoredTheme = localStorage.getItem('theme');
    originalBodyTheme = document.body.getAttribute('data-theme');
    localStorage.removeItem('theme');
    document.body.removeAttribute('data-theme');
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    TestBed.resetTestingModule();

    if (originalStoredTheme === null) {
      localStorage.removeItem('theme');
    } else {
      localStorage.setItem('theme', originalStoredTheme);
    }

    if (originalBodyTheme === null) {
      document.body.removeAttribute('data-theme');
    } else {
      document.body.setAttribute('data-theme', originalBodyTheme);
    }
  });

  it('defaults to light and applies it when no preference is saved', () => {
    const service = TestBed.inject(ThemeService);
    TestBed.flushEffects();

    expect(service.theme()).toBe('light');
    expect(document.body.getAttribute('data-theme')).toBe('light');
    expect(localStorage.getItem('theme')).toBe('light');
  });

  for (const theme of ['light', 'dark'] as const) {
    it(`restores and applies the saved ${theme} theme`, () => {
      localStorage.setItem('theme', theme);

      const service = TestBed.inject(ThemeService);
      TestBed.flushEffects();

      expect(service.theme()).toBe(theme);
      expect(document.body.getAttribute('data-theme')).toBe(theme);
      expect(localStorage.getItem('theme')).toBe(theme);
    });
  }

  it('toggles from light to dark and persists the change', () => {
    const service = TestBed.inject(ThemeService);
    TestBed.flushEffects();

    service.toggle();
    TestBed.flushEffects();

    expect(service.theme()).toBe('dark');
    expect(document.body.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('toggles from dark to light and persists the change', () => {
    localStorage.setItem('theme', 'dark');
    const service = TestBed.inject(ThemeService);
    TestBed.flushEffects();

    service.toggle();
    TestBed.flushEffects();

    expect(service.theme()).toBe('light');
    expect(document.body.getAttribute('data-theme')).toBe('light');
    expect(localStorage.getItem('theme')).toBe('light');
  });
});
