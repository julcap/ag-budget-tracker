import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CategoryService } from './category.service';
import { TransactionService } from './transaction.service';
import { flushStoreLoads, signIn, signOut, TEST_CATEGORIES } from '../testing/session';

describe('CategoryService', () => {
  let service: CategoryService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(CategoryService);
  });

  afterEach(() => {
    http.verify();
    localStorage.removeItem('budget_session_token');
  });

  it('stays empty and makes no request while signed out', () => {
    TestBed.flushEffects();
    http.expectNone('/api/budget-tracker/categories');
    expect(service.expenseCategories()).toEqual([]);
  });

  it('loads the user\'s categories on sign-in and clears them on sign-out', () => {
    signIn();
    flushStoreLoads();
    expect(service.expenseCategories()).toEqual(TEST_CATEGORIES.expense);
    expect(service.getDefaultCategory('income')).toBe('Salary');
    expect(service.isExpense('Rent')).toBeTrue();
    expect(service.isIncome('Rent')).toBeFalse();
    expect(service.allCategories().filter(c => c === 'Other').length).toBe(1);

    signOut();
    expect(service.expenseCategories()).toEqual([]);
  });

  it('adds a category through the API and takes the returned lists', () => {
    signIn();
    flushStoreLoads();
    service.add('expense', ' Healthcare ').subscribe();
    const req = http.expectOne(r => r.method === 'POST' && r.url === '/api/budget-tracker/categories');
    expect(req.request.body).toEqual({ type: 'expense', name: 'Healthcare' });
    req.flush({ ...TEST_CATEGORIES, expense: [...TEST_CATEGORIES.expense, 'Healthcare'] });
    expect(service.isExpense('Healthcare')).toBeTrue();
  });

  it('deletes with a single request and mirrors the server-side reassignment locally', () => {
    signIn();
    flushStoreLoads({
      transactions: [
        { id: '1', type: 'expense', merchant: 'A', category: 'Rent', amount: -1, date: '2026-11-01' },
        { id: '2', type: 'income', merchant: 'B', category: 'Rent', amount: 1, date: '2026-11-01' }
      ]
    });
    const transactions = TestBed.inject(TransactionService);

    service.remove('expense', 'Rent').subscribe();
    const req = http.expectOne('/api/budget-tracker/categories/expense/Rent');
    expect(req.request.method).toBe('DELETE');
    req.flush({ ...TEST_CATEGORIES, expense: TEST_CATEGORIES.expense.filter(c => c !== 'Rent') });

    expect(service.isExpense('Rent')).toBeFalse();
    expect(transactions.transactions().map(t => t.category)).toEqual(['Uncategorized', 'Rent']);
  });
});
