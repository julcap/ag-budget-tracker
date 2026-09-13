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

  it('should round amount to 2 decimal places', () => {
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
      amount: 42.57,
      date: 'Today'
    });
  });


  it('should submit positive amount when adding a transaction', () => {
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
      amount: 42.5,
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
      amount: 42.5,
      date: '2026-09-09',
      notes: 'Weekly grocery run'
    });
  });

  it('should submit positive amount when editing a transaction', () => {
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
      amount: 15,
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

  it('should update type when clicking income button', () => {
    const buttons: HTMLButtonElement[] = fixture.nativeElement.querySelectorAll('.type-selector button');
    expect(buttons.length).toBe(2);
    expect(buttons[0].textContent?.trim()).toBe('Expense');
    expect(buttons[1].textContent?.trim()).toBe('Income');

    expect(buttons[0].classList.contains('active')).toBeTrue();
    expect(buttons[1].classList.contains('active')).toBeFalse();

    buttons[1].click();
    fixture.detectChanges();

    expect(component.form.controls.type.value).toBe('income');
    expect(buttons[0].classList.contains('active')).toBeFalse();
    expect(buttons[1].classList.contains('active')).toBeTrue();
  });

  it('should submit transaction with type income when selected', () => {
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

  it('should reset form and navigate to transactions on cancel', () => {
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate');

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
    expect(router.navigate).toHaveBeenCalledWith(['/transactions']);
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
});
