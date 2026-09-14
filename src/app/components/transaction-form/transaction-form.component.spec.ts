import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TransactionFormComponent } from './transaction-form.component';
import { TransactionService } from '../../services/transaction.service';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { Transaction } from '../../models/transaction';

describe('TransactionFormComponent', () => {
  let component: TransactionFormComponent;
  let fixture: ComponentFixture<TransactionFormComponent>;
  let transactionServiceMock: {
    transactions: any;
    add: jasmine.Spy;
    update: jasmine.Spy;
  };

  beforeEach(async () => {
    transactionServiceMock = {
      transactions: signal<Transaction[]>([]),
      add: jasmine.createSpy('add'),
      update: jasmine.createSpy('update')
    };

    await TestBed.configureTestingModule({
      imports: [TransactionFormComponent],
      providers: [
        provideRouter([{ path: 'transactions', component: TransactionFormComponent }]),
        { provide: TransactionService, useValue: transactionServiceMock }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TransactionFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should submit negative amount when adding negative transaction', () => {
    component.form.setValue({
      type: 'expense',
      merchant: 'Refund',
      amount: -25.5,
      category: 'Groceries',
      date: 'Today',
      notes: ''
    });

    component.submit();

    expect(transactionServiceMock.add).toHaveBeenCalledWith({
      type: 'expense',
      merchant: 'Refund',
      category: 'Groceries',
      amount: -25.5,
      date: 'Today'
    });
  });

  it('should round amount to 2 decimal places and submit negative for expense', () => {
    component.form.setValue({
      type: 'expense',
      merchant: 'Gas Station',
      amount: 42.567,
      category: 'Transport',
      date: 'Today',
      notes: ''
    });

    component.submit();

    expect(transactionServiceMock.add).toHaveBeenCalledWith({
      type: 'expense',
      merchant: 'Gas Station',
      category: 'Transport',
      amount: -42.57,
      date: 'Today'
    });
  });

  it('should submit negative amount when adding an expense transaction with positive input', () => {
    component.form.setValue({
      type: 'expense',
      merchant: 'Supermarket',
      amount: 42.5,
      category: 'Groceries',
      date: 'Sep 10',
      notes: ''
    });

    component.submit();

    expect(transactionServiceMock.add).toHaveBeenCalledWith({
      type: 'expense',
      merchant: 'Supermarket',
      category: 'Groceries',
      amount: -42.5,
      date: 'Sep 10'
    });
  });

  it('should submit transaction with notes when adding a transaction', () => {
    component.form.setValue({
      type: 'expense',
      merchant: 'Supermarket',
      amount: 42.5,
      category: 'Groceries',
      date: '2026-09-09',
      notes: 'Weekly grocery run'
    });

    component.submit();

    expect(transactionServiceMock.add).toHaveBeenCalledWith({
      type: 'expense',
      merchant: 'Supermarket',
      category: 'Groceries',
      amount: -42.5,
      date: '2026-09-09',
      notes: 'Weekly grocery run'
    });
  });

  it('should submit negative amount when editing an expense transaction', () => {
    component.editingId = 'tx-1';
    component.form.setValue({
      type: 'expense',
      merchant: 'Coffee Shop',
      amount: 15,
      category: 'Entertainment',
      date: 'Sep 8',
      notes: 'Meeting with Alex'
    });

    component.submit();

    expect(transactionServiceMock.update).toHaveBeenCalledWith('tx-1', {
      type: 'expense',
      merchant: 'Coffee Shop',
      category: 'Entertainment',
      amount: -15,
      date: 'Sep 8',
      notes: 'Meeting with Alex'
    });
  });

  it('should patch existing transaction values including date and notes on init', () => {
    transactionServiceMock.transactions.set([
      { id: 'tx-123', type: 'income', merchant: 'Target', amount: 55, category: 'Groceries', date: 'Sep 5', notes: 'Office supplies' }
    ]);
    const route = TestBed.inject(provideRouter([{ path: 'transactions/:id/edit', component: TransactionFormComponent }]) ? ActivatedRoute : ActivatedRoute);
    spyOn(component['route'].snapshot.paramMap, 'get').and.returnValue('tx-123');

    component.ngOnInit();

    expect(component.form.value).toEqual({
      type: 'income',
      merchant: 'Target',
      amount: 55,
      category: 'Groceries',
      date: 'Sep 5',
      notes: 'Office supplies'
    });
  });

  it('should default type to expense', () => {
    expect(component.form.controls.type.value).toBe('expense');
  });

  it('should update type and categories when clicking income button', () => {
    const buttons: HTMLButtonElement[] = fixture.nativeElement.querySelectorAll('.type-selector button');
    expect(buttons.length).toBe(2);
    expect(buttons[0].textContent?.trim()).toBe('Expense');
    expect(buttons[1].textContent?.trim()).toBe('Income');

    expect(buttons[0].classList.contains('active')).toBeTrue();
    expect(buttons[1].classList.contains('active')).toBeFalse();
    expect(component.categories).toEqual(component.expenseCategories);

    buttons[1].click();
    fixture.detectChanges();

    expect(component.form.controls.type.value).toBe('income');
    expect(component.categories).toEqual(component.incomeCategories);
    expect(component.form.controls.category.value).toBe('Salary');
    expect(buttons[0].classList.contains('active')).toBeFalse();
    expect(buttons[1].classList.contains('active')).toBeTrue();
  });

  it('should switch categories back to expense and default to Groceries when clicking Expense', () => {
    component.setType('income');
    expect(component.form.controls.category.value).toBe('Salary');
    expect(component.categories).toEqual(component.incomeCategories);

    component.setType('expense');
    expect(component.form.controls.category.value).toBe('Groceries');
    expect(component.categories).toEqual(component.expenseCategories);
  });

  it('should preserve category if valid in both types', () => {
    component.form.controls.category.setValue('Other');
    component.setType('income');
    expect(component.form.controls.category.value).toBe('Other');

    component.setType('expense');
    expect(component.form.controls.category.value).toBe('Other');
  });

  it('should submit transaction with positive amount when type income is selected', () => {
    component.setType('income');
    component.form.patchValue({
      merchant: 'Paycheck',
      amount: 3500,
      category: 'Salary',
      date: '2026-09-01'
    });

    component.submit();

    expect(transactionServiceMock.add).toHaveBeenCalledWith({
      type: 'income',
      merchant: 'Paycheck',
      category: 'Salary',
      amount: 3500,
      date: '2026-09-01'
    });
  });

  it('should submit positive amount when editing an income transaction', () => {
    component.editingId = 'tx-income-1';
    component.form.setValue({
      type: 'income',
      merchant: 'Freelance Client',
      amount: 750,
      category: 'Freelance',
      date: 'Sep 12',
      notes: 'Website design'
    });

    component.submit();

    expect(transactionServiceMock.update).toHaveBeenCalledWith('tx-income-1', {
      type: 'income',
      merchant: 'Freelance Client',
      category: 'Freelance',
      amount: 750,
      date: 'Sep 12',
      notes: 'Website design'
    });
  });

  it('should reset form and emit dialogClose on cancel', () => {
    spyOn(component.dialogClose, 'emit');

    component.editingId = 'tx-123';
    component.form.patchValue({
      merchant: 'Some store',
      amount: 99
    });

    component.cancel();

    expect(component.editingId).toBeNull();
    expect(component.form.value).toEqual({
      type: 'expense',
      merchant: '',
      amount: null,
      category: 'Groceries',
      date: 'Today',
      notes: ''
    });
    expect(component.dialogClose.emit).toHaveBeenCalled();
  });

  it('should call cancel when clicking Cancel button or close icon', () => {
    spyOn(component, 'cancel');

    const cancelBtn: HTMLButtonElement | null = fixture.nativeElement.querySelector('.btn-secondary');
    expect(cancelBtn?.textContent?.trim()).toBe('Cancel');
    cancelBtn?.click();

    const closeBtn: HTMLButtonElement | null = fixture.nativeElement.querySelector('.close-btn');
    expect(closeBtn).toBeTruthy();
    closeBtn?.click();

    expect(component.cancel).toHaveBeenCalledTimes(2);
  });

  it('should emit dialogClose on successful submit', () => {
    spyOn(component.dialogClose, 'emit');

    component.form.setValue({
      type: 'expense',
      merchant: 'Groceries Store',
      amount: 45,
      category: 'Groceries',
      date: 'Today',
      notes: ''
    });
    component.submit();
    expect(component.dialogClose.emit).toHaveBeenCalled();
  });
});
