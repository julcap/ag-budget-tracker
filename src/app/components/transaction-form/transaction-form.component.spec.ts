import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TransactionFormComponent } from './transaction-form.component';
import { TransactionService } from '../../services/transaction.service';
import { provideRouter } from '@angular/router';
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
      merchant: 'Refund',
      amount: -25.5,
      category: 'Groceries'
    });

    component.submit();

    expect(transactionServiceMock.add).toHaveBeenCalledWith({
      merchant: 'Refund',
      category: 'Groceries',
      amount: -25.5,
      date: 'Today'
    });
  });

  it('should round amount to 2 decimal places', () => {
    component.form.setValue({
      merchant: 'Gas Station',
      amount: 42.567,
      category: 'Transport'
    });

    component.submit();

    expect(transactionServiceMock.add).toHaveBeenCalledWith({
      merchant: 'Gas Station',
      category: 'Transport',
      amount: 42.57,
      date: 'Today'
    });
  });


  it('should submit positive amount when adding a transaction', () => {
    component.form.setValue({
      merchant: 'Supermarket',
      amount: 42.5,
      category: 'Groceries'
    });

    component.submit();

    expect(transactionServiceMock.add).toHaveBeenCalledWith({
      merchant: 'Supermarket',
      category: 'Groceries',
      amount: 42.5,
      date: 'Today'
    });
  });

  it('should submit positive amount when editing a transaction', () => {
    component.editingId = 'tx-1';
    component.form.setValue({
      merchant: 'Coffee Shop',
      amount: 15,
      category: 'Entertainment'
    });

    component.submit();

    expect(transactionServiceMock.update).toHaveBeenCalledWith('tx-1', {
      merchant: 'Coffee Shop',
      category: 'Entertainment',
      amount: 15
    });
  });
});
