import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SettingsComponent } from './settings.component';
import { provideRouter } from '@angular/router';
import { SettingsService } from '../../services/settings.service';

describe('SettingsComponent', () => {
  let component: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;
  let settingsService: SettingsService;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [SettingsComponent],
      providers: [provideRouter([]), SettingsService, provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    settingsService = TestBed.inject(SettingsService);
    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('moves related expenses before removing their category', () => {
    const http = TestBed.inject(HttpTestingController);
    http.expectOne(`${environment.apiUrl}/transactions`).flush([]);
    component.deleteCategory('Groceries');
    http.expectOne(`${environment.apiUrl}/transactions`).flush([
      { id: 'expense', type: 'expense', category: 'Groceries', amount: -20 },
      { id: 'income', type: 'income', category: 'Groceries', amount: 20 }
    ]);
    expect(component.categories.isExpense('Groceries')).toBeTrue();
    const patch = http.expectOne(`${environment.apiUrl}/transactions/expense`);
    expect(patch.request.body).toEqual({ category: 'Uncategorized' });
    patch.flush({ id: 'expense', type: 'expense', category: 'Uncategorized', amount: -20 });
    expect(component.categories.isExpense('Groceries')).toBeFalse();
    http.verify();
  });

  it('keeps the category when reassignment fails', () => {
    const http = TestBed.inject(HttpTestingController);
    http.expectOne(`${environment.apiUrl}/transactions`).flush([]);
    component.deleteCategory('Rent');
    http.expectOne(`${environment.apiUrl}/transactions`).flush(null, { status: 500, statusText: 'Error' });
    expect(component.categories.isExpense('Rent')).toBeTrue();
    expect(component.categoryError).toContain('category was kept');
    http.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle theme', () => {
    const initial = component.theme();
    component.toggleTheme();
    expect(component.theme()).not.toEqual(initial);
  });

  it('should update spending thresholds from input values', () => {
    component.setThreshold('spendingWarningPercent', '45');
    expect(settingsService.spendingWarningPercent()).toBe(45);

    component.setThreshold('spendingDangerPercent', 95);
    expect(settingsService.spendingDangerPercent()).toBe(95);
  });

  it('should persist the selected currency', () => {
    component.setCurrency('DKK');
    expect(settingsService.currency()).toBe('DKK');
  });
});
