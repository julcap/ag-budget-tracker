import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { SettingsComponent } from './settings.component';
import { flushStoreLoads, signIn, TEST_CATEGORIES, TEST_SETTINGS } from '../../testing/session';

describe('SettingsComponent', () => {
  let component: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettingsComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;
    signIn();
    fixture.detectChanges();
    flushStoreLoads();
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
    localStorage.removeItem('budget_session_token');
  });

  it('shows the account from the session', () => {
    expect(fixture.nativeElement.textContent).toContain('tester@example.com');
  });

  it('deletes a category with one request', () => {
    component.deleteCategory('Groceries');
    expect(component.deletingCategory).toBe('Groceries');
    const req = http.expectOne('/api/budget-tracker/categories/expense/Groceries');
    expect(req.request.method).toBe('DELETE');
    req.flush({ ...TEST_CATEGORIES, expense: TEST_CATEGORIES.expense.filter(c => c !== 'Groceries') });

    expect(component.categories.isExpense('Groceries')).toBeFalse();
    expect(component.deletingCategory).toBeNull();
  });

  it('keeps the category and shows the error when deletion fails', () => {
    component.deleteCategory('Rent');
    http.expectOne('/api/budget-tracker/categories/expense/Rent').flush({ error: 'boom' }, { status: 500, statusText: 'Error' });
    expect(component.categories.isExpense('Rent')).toBeTrue();
    expect(component.categoryError).toBe('boom');
  });

  it('never deletes Uncategorized', () => {
    component.deleteCategory('Uncategorized');
    http.expectNone('/api/budget-tracker/categories/expense/Uncategorized');
  });

  it('adds a category and shows duplicate errors from the API', () => {
    component.categoryName = 'groceries';
    component.addCategory();
    http.expectOne(r => r.method === 'POST').flush(
      { error: 'A category with that name already exists' }, { status: 409, statusText: 'Conflict' }
    );
    expect(component.categoryError).toBe('A category with that name already exists');
    expect(component.categoryName).toBe('groceries');
  });

  it('saves thresholds and currency to the account', () => {
    component.setThreshold('spendingWarningPercent', '45');
    const threshold = http.expectOne(r => r.method === 'PUT');
    expect(threshold.request.body).toEqual({ spendingWarningPercent: 45 });
    threshold.flush({ ...TEST_SETTINGS, spendingWarningPercent: 45 });
    expect(component.settings.spendingWarningPercent()).toBe(45);

    component.setCurrency('DKK');
    http.expectOne(r => r.method === 'PUT').flush({ ...TEST_SETTINGS, currency: 'DKK' });
    expect(component.settings.currency()).toBe('DKK');
  });

  it('toggles the theme through the account settings', () => {
    component.toggleTheme();
    expect(http.expectOne(r => r.method === 'PUT').request.body).toEqual({ theme: 'dark' });
  });
});
