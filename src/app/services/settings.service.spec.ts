import { TestBed } from '@angular/core/testing';
import { SettingsService } from './settings.service';

describe('SettingsService', () => {
  let service: SettingsService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(SettingsService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created with default values', () => {
    expect(service).toBeTruthy();
    expect(service.spendingWarningPercent()).toBe(50);
    expect(service.spendingWarningIconPercent()).toBe(75);
    expect(service.spendingDangerPercent()).toBe(100);
  });

  it('should update thresholds and persist', () => {
    service.setSpendingWarningPercent(40);
    service.setSpendingWarningIconPercent(80);
    service.setSpendingDangerPercent(90);

    expect(service.spendingWarningPercent()).toBe(40);
    expect(service.spendingWarningIconPercent()).toBe(80);
    expect(service.spendingDangerPercent()).toBe(90);
  });

  it('should reset to defaults', () => {
    service.setSpendingWarningPercent(60);
    service.resetToDefaults();

    expect(service.spendingWarningPercent()).toBe(50);
    expect(service.spendingWarningIconPercent()).toBe(75);
    expect(service.spendingDangerPercent()).toBe(100);
  });
});
