import { TestBed } from '@angular/core/testing';
import { SettingsService } from './settings.service';

describe('SettingsService', () => {
  let service: SettingsService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(SettingsService);
  });

  afterEach(() => localStorage.clear());

  it('starts with defaults', () => {
    expect(service.currency()).toBe('USD');
    expect(service.userName()).toBe('');
    expect(service.spendingWarningPercent()).toBe(50);
    expect(service.spendingWarningIconPercent()).toBe(75);
    expect(service.spendingDangerPercent()).toBe(100);
  });

  it('persists changes so a new instance picks them up', () => {
    service.update({ currency: 'DKK', userName: 'Sam Lee' });
    service.setThreshold('spendingWarningPercent', 40);

    const reloaded = TestBed.runInInjectionContext(() => new SettingsService());
    expect(reloaded.currency()).toBe('DKK');
    expect(reloaded.userName()).toBe('Sam Lee');
    expect(reloaded.spendingWarningPercent()).toBe(40);
  });

  it('clamps negative thresholds and ignores non-numbers', () => {
    service.setThreshold('spendingDangerPercent', -10);
    expect(service.spendingDangerPercent()).toBe(0);
    service.setThreshold('spendingDangerPercent', NaN);
    expect(service.spendingDangerPercent()).toBe(0);
  });

  it('resets only the thresholds', () => {
    service.update({ currency: 'EUR' });
    service.setThreshold('spendingWarningPercent', 60);
    service.resetThresholds();

    expect(service.spendingWarningPercent()).toBe(50);
    expect(service.currency()).toBe('EUR');
  });

  it('falls back to defaults for corrupt or invalid stored values', () => {
    localStorage.setItem('budget_settings', JSON.stringify({ currency: 'XYZ', spendingWarningPercent: 'lots' }));
    const reloaded = TestBed.runInInjectionContext(() => new SettingsService());
    expect(reloaded.currency()).toBe('USD');
    expect(reloaded.spendingWarningPercent()).toBe(50);

    localStorage.setItem('budget_settings', '{not json');
    expect(TestBed.runInInjectionContext(() => new SettingsService()).currency()).toBe('USD');
  });
});
