import { Injectable, signal, effect } from '@angular/core';

export interface SpendingThresholdSettings {
  spendingWarningPercent: number;     // e.g. 50% for orange text
  spendingWarningIconPercent: number; // e.g. 75% for warning icon
  spendingDangerPercent: number;      // e.g. 100% for red text (when spent > income)
}

const DEFAULT_SETTINGS: SpendingThresholdSettings = {
  spendingWarningPercent: 50,
  spendingWarningIconPercent: 75,
  spendingDangerPercent: 100
};

const STORAGE_KEY = 'budget_settings';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private initial = this.loadSettings();

  private _spendingWarningPercent = signal<number>(this.initial.spendingWarningPercent);
  private _spendingWarningIconPercent = signal<number>(this.initial.spendingWarningIconPercent);
  private _spendingDangerPercent = signal<number>(this.initial.spendingDangerPercent);

  readonly spendingWarningPercent = this._spendingWarningPercent.asReadonly();
  readonly spendingWarningIconPercent = this._spendingWarningIconPercent.asReadonly();
  readonly spendingDangerPercent = this._spendingDangerPercent.asReadonly();

  constructor() {
    effect(() => {
      const current: SpendingThresholdSettings = {
        spendingWarningPercent: this._spendingWarningPercent(),
        spendingWarningIconPercent: this._spendingWarningIconPercent(),
        spendingDangerPercent: this._spendingDangerPercent()
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
      } catch {
        // ignore storage errors in environments without localStorage
      }
    });
  }

  setSpendingWarningPercent(percent: number) {
    this._spendingWarningPercent.set(Math.max(0, percent));
  }

  setSpendingWarningIconPercent(percent: number) {
    this._spendingWarningIconPercent.set(Math.max(0, percent));
  }

  setSpendingDangerPercent(percent: number) {
    this._spendingDangerPercent.set(Math.max(0, percent));
  }

  resetToDefaults() {
    this._spendingWarningPercent.set(DEFAULT_SETTINGS.spendingWarningPercent);
    this._spendingWarningIconPercent.set(DEFAULT_SETTINGS.spendingWarningIconPercent);
    this._spendingDangerPercent.set(DEFAULT_SETTINGS.spendingDangerPercent);
  }

  private loadSettings(): SpendingThresholdSettings {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          spendingWarningPercent: typeof parsed.spendingWarningPercent === 'number' ? parsed.spendingWarningPercent : DEFAULT_SETTINGS.spendingWarningPercent,
          spendingWarningIconPercent: typeof parsed.spendingWarningIconPercent === 'number' ? parsed.spendingWarningIconPercent : DEFAULT_SETTINGS.spendingWarningIconPercent,
          spendingDangerPercent: typeof parsed.spendingDangerPercent === 'number' ? parsed.spendingDangerPercent : DEFAULT_SETTINGS.spendingDangerPercent
        };
      }
    } catch {
      // ignore JSON parse error
    }
    return { ...DEFAULT_SETTINGS };
  }
}
