import { computed, Injectable, signal } from '@angular/core';
import { CURRENCIES, CurrencyCode } from '../utils/money';

export interface Settings {
  currency: CurrencyCode;
  userName: string;
  userEmail: string;
  /** Spent % of income at which the spent amount turns orange. */
  spendingWarningPercent: number;
  /** Spent % of income at which the warning icon appears. */
  spendingWarningIconPercent: number;
  /** Spent % of income at which the spent amount turns red. */
  spendingDangerPercent: number;
}

export type ThresholdKey = 'spendingWarningPercent' | 'spendingWarningIconPercent' | 'spendingDangerPercent';

const DEFAULT_THRESHOLDS: Pick<Settings, ThresholdKey> = {
  spendingWarningPercent: 50,
  spendingWarningIconPercent: 75,
  spendingDangerPercent: 100
};

const DEFAULT_SETTINGS: Settings = {
  currency: 'USD',
  userName: '',
  userEmail: '',
  ...DEFAULT_THRESHOLDS
};

const STORAGE_KEY = 'budget_settings';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private state = signal<Settings>(this.load());

  readonly currency = computed(() => this.state().currency);
  readonly userName = computed(() => this.state().userName);
  readonly userEmail = computed(() => this.state().userEmail);
  readonly spendingWarningPercent = computed(() => this.state().spendingWarningPercent);
  readonly spendingWarningIconPercent = computed(() => this.state().spendingWarningIconPercent);
  readonly spendingDangerPercent = computed(() => this.state().spendingDangerPercent);

  update(changes: Partial<Settings>) {
    this.state.update(current => ({ ...current, ...changes }));
    this.persist();
  }

  setThreshold(key: ThresholdKey, percent: number) {
    if (Number.isFinite(percent)) this.update({ [key]: Math.max(0, percent) });
  }

  resetThresholds() {
    this.update(DEFAULT_THRESHOLDS);
  }

  private persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state()));
    } catch {
      // Storage can be unavailable (private mode); settings then last for the session only.
    }
  }

  private load(): Settings {
    let stored: Record<string, unknown> = {};
    try {
      stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') ?? {};
    } catch {
      // Corrupt or unavailable storage: fall back to defaults.
    }
    const settings = { ...DEFAULT_SETTINGS };
    for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[]) {
      if (typeof stored[key] === typeof DEFAULT_SETTINGS[key]) (settings as Record<string, unknown>)[key] = stored[key];
    }
    if (!CURRENCIES.includes(settings.currency)) settings.currency = DEFAULT_SETTINGS.currency;
    return settings;
  }
}
