import { TestBed } from '@angular/core/testing';
import { BudgetService } from './budget.service';
import { CategoryService } from './category.service';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../environments/environment';

describe('BudgetService', () => {
  let service: BudgetService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.removeItem('budget_categories');
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(BudgetService);
    http = TestBed.inject(HttpTestingController);
    http.expectOne(`${environment.apiUrl}/budgets`).flush([{ id: 'rent', name: 'Rent', spent: 999, limit: 1000 }]);
    http.expectOne(`${environment.apiUrl}/transactions`).flush([
      { id: '1', type: 'expense', category: 'Rent', amount: -100, date: 'Today' },
      { id: '2', type: 'income', category: 'Rent', amount: 50, date: 'Today' },
      { id: '3', category: 'Unknown', amount: -20, date: 'Today' },
      { id: '4', type: 'expense', category: 'Rent', amount: -500, date: '2000-01-01' }
    ]);
  });
  afterEach(() => { http.verify(); localStorage.removeItem('budget_categories'); });

  it('derives monthly spending from expenses, including legacy and unknown categories', () => {
    expect(service.budgets().find(b => b.name === 'Rent')?.spent).toBe(100);
    expect(service.budgets().find(b => b.name === 'Uncategorized')?.spent).toBe(20);
    expect(service.globalBudget().spent).toBe(120);
    expect(service.budgets().reduce((sum, b) => sum + b.spent, 0)).toBe(120);
  });

  it('creates and removes cards with expense categories', () => {
    const categories = TestBed.inject(CategoryService);
    categories.add('expense', 'Healthcare');
    expect(service.budgets().find(b => b.name === 'Healthcare')?.limit).toBe(Infinity);
    categories.remove('expense', 'Healthcare');
    expect(service.budgets().some(b => b.name === 'Healthcare')).toBeFalse();
  });

  it('persists existing limits using the individual budget endpoint', () => {
    service.updateLimit('rent', 1200).subscribe();
    const request = http.expectOne(`${environment.apiUrl}/budgets/rent`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ limit: 1200, scope: 'category' });
    request.flush({ id: 'rent', name: 'Rent', limit: 1200 });
    expect(service.budgets().find(b => b.name === 'Rent')?.limit).toBe(1200);
  });

  it('saves a global limit independently of category limits', () => {
    service.updateLimit('global', 2000).subscribe();
    const request = http.expectOne(`${environment.apiUrl}/budgets`);
    expect(request.request.method).toBe('POST');
    request.flush({ ...request.request.body, id: 'generated-global-id' });
    expect(service.globalBudget().limit).toBe(2000);
    service.updateLimit('global', 2500).subscribe();
    const update = http.expectOne(`${environment.apiUrl}/budgets/generated-global-id`);
    expect(update.request.method).toBe('PATCH');
    update.flush({ id: 'generated-global-id', name: 'Total expenses', scope: 'global', limit: 2500 });
    expect(service.globalBudget().limit).toBe(2500);
    expect(service.budgets().find(b => b.name === 'Rent')?.limit).toBe(1000);
  });

  it('loads the latest legacy global save after reloading and updates its generated ID', () => {
    const reloaded = TestBed.runInInjectionContext(() => new BudgetService());
    http.expectOne(`${environment.apiUrl}/budgets`).flush([
      { id: 'first', name: 'Total expenses', limit: 900 },
      { id: 'latest', name: 'Total expenses', limit: 2000 }
    ]);
    expect(reloaded.globalBudget().limit).toBe(2000);
    reloaded.updateLimit('global', 3000).subscribe();
    const update = http.expectOne(`${environment.apiUrl}/budgets/latest`);
    expect(update.request.body).toEqual({ limit: 3000, scope: 'global' });
    update.flush({ id: 'latest', name: 'Total expenses', scope: 'global', limit: 3000 });
    expect(reloaded.globalBudget().limit).toBe(3000);
  });

  it('treats a cleared category limit as unlimited', () => {
    service.updateLimit('rent', 0).subscribe();
    http.expectOne(`${environment.apiUrl}/budgets/rent`).flush({ id: 'rent', name: 'Rent', limit: 0 });
    expect(service.budgets().find(b => b.name === 'Rent')?.limit).toBe(Infinity);
  });

  it('retains the previous limit when saving fails', () => {
    service.updateLimit('rent', 1200).subscribe({ error: () => {} });
    http.expectOne(`${environment.apiUrl}/budgets/rent`).flush(null, { status: 500, statusText: 'Error' });
    expect(service.budgets().find(b => b.name === 'Rent')?.limit).toBe(1000);
  });
});
