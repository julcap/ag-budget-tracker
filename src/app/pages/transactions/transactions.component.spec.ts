import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { TransactionsComponent } from './transactions.component';
import { TransactionService } from '../../services/transaction.service';
import { CategoryService } from '../../services/category.service';
import { Transaction } from '../../models/transaction';
import { flushStoreLoads, signIn, TEST_CATEGORIES } from '../../testing/session';

describe('TransactionsComponent', () => {
  let component: TransactionsComponent;
  let fixture: ComponentFixture<TransactionsComponent>;
  const transactions = signal<Transaction[]>([]);

  beforeEach(async () => {
    transactions.set([
      { id: 'a', type: 'expense', merchant: 'Whole Foods', category: 'Groceries', amount: -80, date: '2026-09-08' },
      { id: 'b', type: 'income', merchant: 'Acme Payroll', category: 'Salary', amount: 2000, date: '2026-09-01' },
      { id: 'c', type: 'expense', merchant: 'Metro card', category: 'Transport', amount: -40, date: '2026-09-15', notes: 'monthly pass' }
    ]);
    await TestBed.configureTestingModule({
      imports: [TransactionsComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: TransactionService, useValue: { transactions, error: signal('') } }]
    }).compileComponents();

    fixture = TestBed.createComponent(TransactionsComponent);
    component = fixture.componentInstance;
    signIn();
    flushStoreLoads();
    fixture.detectChanges();
  });

  afterEach(() => localStorage.removeItem('budget_session_token'));

  const ids = () => component.filteredTransactions().map(t => t.id);

  it('lists the newest transactions first by default', () => {
    expect(ids()).toEqual(['c', 'a', 'b']);
  });

  it('offers every category plus All as a filter, tracking category changes', () => {
    const categories = TestBed.inject(CategoryService);
    expect(component.categories()).toEqual(['All', ...categories.allCategories()]);
    categories.add('expense', 'Healthcare').subscribe();
    TestBed.inject(HttpTestingController).expectOne(r => r.method === 'POST')
      .flush({ ...TEST_CATEGORIES, expense: [...TEST_CATEGORIES.expense, 'Healthcare'] });
    expect(component.categories()).toContain('Healthcare');
  });

  it('filters by search query across merchant, category and notes', () => {
    component.query.set('whole');
    expect(ids()).toEqual(['a']);
    component.query.set('pass');
    expect(ids()).toEqual(['c']);
  });

  it('filters by category and can clear all filters', () => {
    component.setCategory('Salary');
    expect(ids()).toEqual(['b']);
    component.query.set('nothing matches');
    expect(ids()).toEqual([]);
    component.clearFilters();
    expect(ids().length).toBe(3);
  });

  it('sorts by signed amount and toggles direction', () => {
    component.toggleSort('amount');
    expect(component.sortDirection()).toBe('desc');
    expect(ids()).toEqual(['b', 'c', 'a']);
    component.toggleSort('amount');
    expect(ids()).toEqual(['a', 'c', 'b']);
  });

  it('shows the net total of the filtered transactions', () => {
    expect(component.filteredTotal()).toBe(1880);
    component.setCategory('Groceries');
    expect(component.filteredTotal()).toBe(-80);
  });

  it('opens the dialog for adding or editing', () => {
    component.onAddRequested();
    expect(component.dialogVisible()).toBeTrue();
    expect(component.editingTransactionId()).toBeNull();

    component.onEditRequested('a');
    expect(component.editingTransactionId()).toBe('a');

    component.closeDialog();
    expect(component.dialogVisible()).toBeFalse();
  });

  it('distinguishes an empty ledger from an over-filtered one', () => {
    component.query.set('zzz');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.empty-state').textContent).toContain('match your filters');

    transactions.set([]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.empty-state').textContent).toContain('No transactions yet');
  });
});
