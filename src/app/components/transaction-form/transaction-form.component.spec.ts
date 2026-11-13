import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { TransactionFormComponent } from './transaction-form.component';
import { TransactionService } from '../../services/transaction.service';
import { CategoryService } from '../../services/category.service';
import { Transaction } from '../../models/transaction';
import { todayIsoDate } from '../../utils/date';
import { flushStoreLoads, signIn } from '../../testing/session';

describe('TransactionFormComponent', () => {
  let component: TransactionFormComponent;
  let fixture: ComponentFixture<TransactionFormComponent>;
  let service: {
    transactions: ReturnType<typeof signal<Transaction[]>>;
    add: jasmine.Spy;
    update: jasmine.Spy;
    remove: jasmine.Spy;
  };

  function create(transactionId: string | null = null) {
    fixture = TestBed.createComponent(TransactionFormComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('transactionId', transactionId);
    fixture.detectChanges();
    spyOn(component.dialogClose, 'emit');
  }

  beforeEach(async () => {
    service = {
      transactions: signal<Transaction[]>([
        { id: 'tx-1', type: 'income', merchant: 'Target', amount: 55, category: 'Salary', date: '2026-09-05', notes: 'Bonus' },
        { id: 'legacy', type: 'expense', merchant: 'Old', amount: -5, category: 'Rent', date: 'Today' }
      ]),
      add: jasmine.createSpy('add').and.returnValue(of({})),
      update: jasmine.createSpy('update').and.returnValue(of({})),
      remove: jasmine.createSpy('remove').and.returnValue(of(undefined))
    };

    await TestBed.configureTestingModule({
      imports: [TransactionFormComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: TransactionService, useValue: service }]
    }).compileComponents();
    // The form takes its default category from the loaded lists, as it does in the app.
    TestBed.inject(CategoryService);
    signIn();
    flushStoreLoads();
  });

  it('starts as a new expense dated today', () => {
    create();
    expect(component.editingId).toBeNull();
    expect(component.form.getRawValue()).toEqual({
      type: 'expense', merchant: '', amount: null, category: 'Groceries', date: todayIsoDate(), notes: ''
    });
    expect(fixture.nativeElement.querySelector('.delete-btn')).toBeNull();
  });

  it('saves expenses as negative, rounded amounts with trimmed text, then closes', () => {
    create();
    component.form.setValue({
      type: 'expense', merchant: ' Gas Station ', amount: 42.567, category: 'Transport', date: '2026-09-09', notes: '  '
    });
    component.submit();

    expect(service.add).toHaveBeenCalledWith({
      type: 'expense', merchant: 'Gas Station', category: 'Transport', amount: -42.57, date: '2026-09-09'
    });
    expect(component.dialogClose.emit).toHaveBeenCalled();
  });

  it('saves income as a positive amount, including notes', () => {
    create();
    component.setType('income');
    component.form.patchValue({ merchant: 'Paycheck', amount: 3500, date: '2026-09-01', notes: 'September' });
    component.submit();

    expect(service.add).toHaveBeenCalledWith({
      type: 'income', merchant: 'Paycheck', category: 'Salary', amount: 3500, date: '2026-09-01', notes: 'September'
    });
  });

  it('rejects zero, negative and missing amounts and blank merchants', () => {
    create();
    for (const amount of [0, -5, null]) {
      component.form.patchValue({ merchant: 'Shop', amount });
      component.submit();
    }
    component.form.patchValue({ merchant: '   ', amount: 5 });
    component.submit();

    expect(service.add).not.toHaveBeenCalled();
    expect(component.form.touched).toBeTrue();
  });

  it('loads an existing transaction and updates it', () => {
    create('tx-1');
    expect(component.editingId).toBe('tx-1');
    expect(component.form.getRawValue()).toEqual({
      type: 'income', merchant: 'Target', amount: 55, category: 'Salary', date: '2026-09-05', notes: 'Bonus'
    });

    component.form.patchValue({ amount: 60 });
    component.submit();
    expect(service.update).toHaveBeenCalledWith('tx-1', jasmine.objectContaining({ amount: 60, type: 'income' }));
  });

  it('converts legacy dates so the date input can display them', () => {
    create('legacy');
    expect(component.form.controls.date.value).toBe(todayIsoDate());
  });

  it('keeps the dialog open and shows an error when saving fails', () => {
    service.add.and.returnValue(throwError(() => new Error('offline')));
    create();
    component.form.patchValue({ merchant: 'Shop', amount: 5 });
    component.submit();

    expect(component.dialogClose.emit).not.toHaveBeenCalled();
    expect(component.busy()).toBeFalse();
    expect(component.error()).toContain('Could not save');
  });

  it('asks for confirmation before deleting', () => {
    create('tx-1');
    component.delete();
    expect(service.remove).not.toHaveBeenCalled();
    expect(component.confirmingDelete()).toBeTrue();

    component.delete();
    expect(service.remove).toHaveBeenCalledWith('tx-1');
    expect(component.dialogClose.emit).toHaveBeenCalled();
  });

  it('switches category lists with the type, keeping categories valid for both', () => {
    create();
    const categories = TestBed.inject(CategoryService);
    component.setType('income');
    expect(component.categories).toEqual(categories.incomeCategories());
    expect(component.form.controls.category.value).toBe('Salary');

    component.form.controls.category.setValue('Other');
    component.setType('expense');
    expect(component.form.controls.category.value).toBe('Other');
  });

  it('closes from the Cancel button and the close icon', () => {
    create();
    fixture.nativeElement.querySelector('.btn-secondary').click();
    fixture.nativeElement.querySelector('.close-btn').click();
    expect(component.dialogClose.emit).toHaveBeenCalledTimes(2);
  });
});
