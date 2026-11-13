import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { SettingsService, Theme } from './settings.service';

const LOCAL_COPY_KEY = 'theme';

/**
 * The theme is an account setting. A copy is kept in localStorage only so the last theme used
 * in this browser applies immediately on load, before the API responds (no light-mode flash).
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private settings = inject(SettingsService);
  private localCopy = signal<Theme>(readLocalCopy());

  readonly theme = computed<Theme>(() => (this.settings.loaded() ? this.settings.theme() : this.localCopy()));

  constructor() {
    effect(() => {
      const theme = this.theme();
      document.body.setAttribute('data-theme', theme);
      writeLocalCopy(theme);
    });
  }

  toggle() {
    this.settings.update({ theme: this.theme() === 'light' ? 'dark' : 'light' });
  }
}

function readLocalCopy(): Theme {
  try {
    return localStorage.getItem(LOCAL_COPY_KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

function writeLocalCopy(theme: Theme) {
  try {
    localStorage.setItem(LOCAL_COPY_KEY, theme);
  } catch {
    // The local copy is only a load-time hint; the account setting is authoritative.
  }
}
