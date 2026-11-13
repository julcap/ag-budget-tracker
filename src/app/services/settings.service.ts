import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CurrencyCode } from '../utils/money';
import { whenSignedIn } from './session';
import { environment } from '../../environments/environment';

export type Theme = 'light' | 'dark';

export interface Settings {
  currency: CurrencyCode;
  /** Spent % of income at which the spent amount turns orange. */
  spendingWarningPercent: number;
  /** Spent % of income at which the warning icon appears. */
  spendingWarningIconPercent: number;
  /** Spent % of income at which the spent amount turns red. */
  spendingDangerPercent: number;
  theme: Theme;
}

export type ThresholdKey = 'spendingWarningPercent' | 'spendingWarningIconPercent' | 'spendingDangerPercent';

const DEFAULT_THRESHOLDS: Pick<Settings, ThresholdKey> = {
  spendingWarningPercent: 50,
  spendingWarningIconPercent: 75,
  spendingDangerPercent: 100
};

// Used until the signed-in user's settings arrive (and after sign-out).
const DEFAULT_SETTINGS: Settings = { currency: 'USD', theme: 'light', ...DEFAULT_THRESHOLDS };

const API = `${environment.apiUrl}/budget-tracker/settings`;

/** Per-account preferences, stored by the API. */
@Injectable({ providedIn: 'root' })
export class SettingsService {
  private http = inject(HttpClient);
  private state = signal<Settings>(DEFAULT_SETTINGS);

  readonly loaded = signal(false);
  readonly error = signal('');
  readonly currency = computed(() => this.state().currency);
  readonly theme = computed(() => this.state().theme);
  readonly spendingWarningPercent = computed(() => this.state().spendingWarningPercent);
  readonly spendingWarningIconPercent = computed(() => this.state().spendingWarningIconPercent);
  readonly spendingDangerPercent = computed(() => this.state().spendingDangerPercent);

  constructor() {
    whenSignedIn(() => this.load(), () => {
      this.state.set(DEFAULT_SETTINGS);
      this.loaded.set(false);
      this.error.set('');
    });
  }

  /** Saves a partial change; the signals take the server's merged result on success. */
  update(changes: Partial<Settings>) {
    this.error.set('');
    this.http.put<Settings>(API, changes).subscribe({
      next: settings => this.state.set(settings),
      error: () => this.error.set('Could not save your settings. Please try again.')
    });
  }

  setThreshold(key: ThresholdKey, percent: number) {
    if (Number.isFinite(percent)) this.update({ [key]: Math.min(1000, Math.max(0, percent)) });
  }

  resetThresholds() {
    this.update(DEFAULT_THRESHOLDS);
  }

  private load() {
    this.http.get<Settings>(API).subscribe({
      next: settings => {
        this.state.set(settings);
        this.loaded.set(true);
      },
      error: () => this.error.set('Unable to load your settings.')
    });
  }
}
