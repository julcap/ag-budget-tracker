import { ComponentFixture, TestBed } from '@angular/core/testing';
import { computed, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { DashboardComponent } from './dashboard.component';
import { TransactionService } from '../../services/transaction.service';
import { SettingsService } from '../../services/settings.service';
import { Transaction } from '../../models/transaction';
import { isSameMonth, parseTransactionDate, todayIsoDate } from '../../utils/date';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let settings: SettingsService;
  const transactions = signal<Transaction[]>([]);
  const today = todayIsoDate();

  const tx = (id: string, type: Transaction['type'], amount: number, category: string, date = today): Transaction =>
    ({ id, type, merchant: id, amount, category, date });

  beforeEach(async () => {
    localStorage.clear();
    transactions.set([]);
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        {
          provide: TransactionService,
          useValue: {
            transactions,
            error: signal(''),
            currentMonth: computed(() => transactions().filter(t => isSameMonth(parseTransactionDate(t.date), new Date())))
          }
        }
      ]
    }).compileComponents();

    settings = TestBed.inject(SettingsService);
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => localStorage.clear());

  it('shows zeros and empty states instead of placeholder data when there are no transactions', () => {
    expect(component.balance()).toBe('$0.00');
    expect(component.incomeThisMonth()).toBe('$0.00');
    expect(component.spentThisMonth()).toBe('$0.00');
    expect(component.categorySpending()).toEqual([]);
    expect(component.isSpentWarningIcon()).toBeFalse();
    expect(fixture.nativeElement.textContent).toContain('No transactions yet');
  });

  it('computes the all-time balance but only this month in the monthly cards', () => {
    transactions.set([
      tx('salary', 'income', 1000, 'Salary'),
      tx('rent', 'expense', -1500, 'Rent'),
      tx('old', 'income', 300, 'Salary', '2001-01-01')
    ]);
    fixture.detectChanges();

    expect(component.balance()).toBe('-$200.00');
    expect(component.balanceTone()).toBe('danger');
    expect(component.incomeThisMonth()).toBe('$1,000.00');
    expect(component.spentThisMonth()).toBe('$1,500.00');
    const balanceCard = fixture.nativeElement.querySelector('app-balance-card .card-value');
    expect(balanceCard.classList).toContain('color-danger');
  });

  it('treats an expense stored with a positive amount as spending', () => {
    transactions.set([tx('legacy', 'expense', 50, 'Groceries')]);
    expect(component.balance()).toBe('-$50.00');
    expect(component.spentThisMonth()).toBe('$50.00');
  });

  it('applies the spending thresholds from settings', () => {
    transactions.set([tx('salary', 'income', 1000, 'Salary'), tx('food', 'expense', -600, 'Groceries')]);
    expect(component.spentTone()).toBe('warn');
    expect(component.isSpentWarningIcon()).toBeFalse();

    settings.setThreshold('spendingWarningIconPercent', 60);
    expect(component.isSpentWarningIcon()).toBeTrue();

    settings.setThreshold('spendingDangerPercent', 55);
    expect(component.spentTone()).toBe('danger');

    settings.resetThresholds();
    transactions.set([tx('salary', 'income', 1000, 'Salary'), tx('food', 'expense', -100, 'Groceries')]);
    expect(component.spentTone()).toBeNull();
  });

  it('flags any spending with no income as danger', () => {
    transactions.set([tx('food', 'expense', -10, 'Groceries')]);
    expect(component.spentTone()).toBe('danger');
    expect(component.isSpentWarningIcon()).toBeTrue();
  });

  it('groups this month\'s spending by category, largest first, with shares', () => {
    transactions.set([
      tx('a', 'expense', -300, 'Rent'),
      tx('b', 'expense', -100, 'Groceries'),
      tx('c', 'income', 999, 'Salary'),
      tx('d', 'expense', -500, 'Rent', '2001-01-01')
    ]);
    expect(component.categorySpending()).toEqual([
      { name: 'Rent', amount: 300, pct: 100, share: 75 },
      { name: 'Groceries', amount: 100, pct: 33, share: 25 }
    ]);

    component.toggleCategory('Groceries');
    expect(component.activeCategoryDetail()).toBe('Groceries: $100.00 · 25% of spending this month');
    component.toggleCategory('Groceries');
    expect(component.activeCategory()).toBeNull();
  });

  it('lists the five most recent transactions newest first', () => {
    transactions.set(['2026-01-03', '2026-01-01', '2026-01-06', '2026-01-02', '2026-01-05', '2026-01-04']
      .map((date, i) => tx(`t${i}`, 'expense', -1, 'Rent', date)));
    expect(component.recentTransactions().map(t => t.date))
      .toEqual(['2026-01-06', '2026-01-05', '2026-01-04', '2026-01-03', '2026-01-02']);
  });

  it('opens the transaction dialog for adding and editing', () => {
    component.openAdd();
    expect(component.dialogVisible()).toBeTrue();
    expect(component.editingTransactionId()).toBeNull();
    component.openEdit('abc');
    expect(component.editingTransactionId()).toBe('abc');
    component.closeDialog();
    expect(component.dialogVisible()).toBeFalse();
  });

  it('formats amounts in the selected currency', () => {
    transactions.set([tx('salary', 'income', 1234.5, 'Salary')]);
    settings.update({ currency: 'EUR' });
    expect(component.balance()).toBe('€1,234.50');
  });
});
