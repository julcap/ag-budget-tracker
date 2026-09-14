import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { TransactionService } from '../../services/transaction.service';
import { SettingsService } from '../../services/settings.service';
import { signal, WritableSignal } from '@angular/core';
import { Transaction } from '../../models/transaction';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let transactionsSignal: WritableSignal<Transaction[]>;
  let settingsService: SettingsService;

  beforeEach(async () => {
    localStorage.clear();
    transactionsSignal = signal<Transaction[]>([]);

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        SettingsService,
        {
          provide: TransactionService,
          useValue: {
            transactions: transactionsSignal.asReadonly()
          }
        }
      ]
    }).compileComponents();

    settingsService = TestBed.inject(SettingsService);
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should compute balance and totals with default fallback when empty', () => {
    expect(component.balance()).toBe('$2,450.00');
    expect(component.isBalanceNegative()).toBeFalse();
    expect(component.incomeThisMonth()).toBe('$4,200.00');
    expect(component.spentThisMonth()).toBe('$1,750.00');
    expect(component.isSpentWarning()).toBeFalse();
    expect(component.isSpentWarningIcon()).toBeFalse();
    expect(component.isSpentDanger()).toBeFalse();
    expect(component.spentValueColor()).toBeNull();
  });

  it('should format negative balance with minus sign and flag isBalanceNegative as true', () => {
    transactionsSignal.set([
      { id: '1', merchant: 'Rent', amount: -1500, category: 'Rent', date: 'Sep 1', type: 'expense' },
      { id: '2', merchant: 'Salary', amount: 1000, category: 'Salary', date: 'Sep 2', type: 'income' }
    ]);
    fixture.detectChanges();

    expect(component.balance()).toBe('-$500.00');
    expect(component.isBalanceNegative()).toBeTrue();

    const balanceCard = fixture.nativeElement.querySelector('.cards-grid app-balance-card');
    expect(balanceCard.querySelector('.card-value')?.classList.contains('color-danger')).toBeTrue();
  });

  it('should set spent color to orange when spent is greater than 50% of income', () => {
    transactionsSignal.set([
      { id: '1', merchant: 'Salary', amount: 1000, category: 'Salary', date: 'Sep 1', type: 'income' },
      { id: '2', merchant: 'Groceries', amount: -600, category: 'Groceries', date: 'Sep 2', type: 'expense' }
    ]);
    fixture.detectChanges();

    expect(component.isSpentWarning()).toBeTrue();
    expect(component.isSpentWarningIcon()).toBeFalse();
    expect(component.isSpentDanger()).toBeFalse();
    expect(component.spentValueColor()).toBe('orange');

    const cards = fixture.nativeElement.querySelectorAll('.cards-grid app-balance-card');
    const spentCard = cards[2];
    expect(spentCard.querySelector('.card-value')?.classList.contains('color-warn')).toBeTrue();
    expect(spentCard.querySelector('.warning-icon')).toBeFalsy();
  });

  it('should show warning icon and orange color when spent is 75% or more of income', () => {
    transactionsSignal.set([
      { id: '1', merchant: 'Salary', amount: 1000, category: 'Salary', date: 'Sep 1', type: 'income' },
      { id: '2', merchant: 'Groceries', amount: -800, category: 'Groceries', date: 'Sep 2', type: 'expense' }
    ]);
    fixture.detectChanges();

    expect(component.isSpentWarning()).toBeTrue();
    expect(component.isSpentWarningIcon()).toBeTrue();
    expect(component.isSpentDanger()).toBeFalse();
    expect(component.spentValueColor()).toBe('orange');

    const cards = fixture.nativeElement.querySelectorAll('.cards-grid app-balance-card');
    const spentCard = cards[2];
    expect(spentCard.querySelector('.card-value')?.classList.contains('color-warn')).toBeTrue();
    expect(spentCard.querySelector('.warning-icon')).toBeTruthy();
  });

  it('should set spent color to red when spent is greater than income', () => {
    transactionsSignal.set([
      { id: '1', merchant: 'Salary', amount: 1000, category: 'Salary', date: 'Sep 1', type: 'income' },
      { id: '2', merchant: 'Rent', amount: -1200, category: 'Rent', date: 'Sep 2', type: 'expense' }
    ]);
    fixture.detectChanges();

    expect(component.isSpentWarning()).toBeTrue();
    expect(component.isSpentWarningIcon()).toBeTrue();
    expect(component.isSpentDanger()).toBeTrue();
    expect(component.spentValueColor()).toBe('red');

    const cards = fixture.nativeElement.querySelectorAll('.cards-grid app-balance-card');
    const spentCard = cards[2];
    expect(spentCard.querySelector('.card-value')?.classList.contains('color-danger')).toBeTrue();
    expect(spentCard.querySelector('.warning-icon')).toBeTruthy();
  });

  it('should react to global threshold changes from SettingsService', () => {
    transactionsSignal.set([
      { id: '1', merchant: 'Salary', amount: 1000, category: 'Salary', date: 'Sep 1', type: 'income' },
      { id: '2', merchant: 'Groceries', amount: -400, category: 'Groceries', date: 'Sep 2', type: 'expense' }
    ]);
    fixture.detectChanges();

    // 40% spent with default 50% warning threshold is normal
    expect(component.spentValueColor()).toBeNull();

    // Lower warning threshold to 30%
    settingsService.setSpendingWarningPercent(30);
    fixture.detectChanges();

    expect(component.isSpentWarning()).toBeTrue();
    expect(component.spentValueColor()).toBe('orange');

    // Lower danger threshold to 35%
    settingsService.setSpendingDangerPercent(35);
    fixture.detectChanges();

    expect(component.isSpentDanger()).toBeTrue();
    expect(component.spentValueColor()).toBe('red');
  });

  it('should not flag warning or danger when spent is below configured thresholds', () => {
    transactionsSignal.set([
      { id: '1', merchant: 'Salary', amount: 1000, category: 'Salary', date: 'Sep 1', type: 'income' },
      { id: '2', merchant: 'Groceries', amount: -400, category: 'Groceries', date: 'Sep 2', type: 'expense' }
    ]);
    fixture.detectChanges();

    expect(component.isSpentWarning()).toBeFalse();
    expect(component.isSpentWarningIcon()).toBeFalse();
    expect(component.isSpentDanger()).toBeFalse();

    const cards = fixture.nativeElement.querySelectorAll('.cards-grid app-balance-card');
    const spentCard = cards[2];
    expect(spentCard.querySelector('.card-value')?.classList.contains('color-warn')).toBeFalse();
    expect(spentCard.querySelector('.card-value')?.classList.contains('color-danger')).toBeFalse();
    expect(spentCard.querySelector('.warning-icon')).toBeFalsy();
  });

  it('should compute category spending and active category detail', () => {
    const cats = component.categorySpending();
    expect(cats.length).toBeGreaterThan(0);
    expect(component.activeCategoryDetail()).toBe('Click a category to see its share of spending');

    component.toggleCategory(cats[0].name);
    expect(component.activeCategory()).toBe(cats[0].name);
    expect(component.activeCategoryDetail()).toContain(cats[0].name);

    component.toggleCategory(cats[0].name);
    expect(component.activeCategory()).toBeNull();
  });

  it('should toggle selected transaction', () => {
    expect(component.selectedTxId()).toBeNull();
    component.toggleSelectedTx('1');
    expect(component.selectedTxId()).toBe('1');
    component.toggleSelectedTx('1');
    expect(component.selectedTxId()).toBeNull();
  });
});
