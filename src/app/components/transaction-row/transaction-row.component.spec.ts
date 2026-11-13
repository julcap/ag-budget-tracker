import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TransactionRowComponent } from './transaction-row.component';
import { Transaction } from '../../models/transaction';

describe('TransactionRowComponent', () => {
  let component: TransactionRowComponent;
  let fixture: ComponentFixture<TransactionRowComponent>;

  const mockTx: Transaction = {
    id: 'tx-1',
    merchant: 'Whole Foods Market',
    amount: -84.20,
    category: 'Groceries',
    date: '2026-09-08',
    type: 'expense'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransactionRowComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TransactionRowComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('transaction', mockTx);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render a formatted date and signed amount', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.date-text')?.textContent).toContain('Sep 8, 2026');
    expect(el.querySelector('.amount-value')?.textContent?.trim()).toBe('-$84.20');
  });

  it('should emit edit event on click', () => {
    spyOn(component.edit, 'emit');
    fixture.nativeElement.querySelector('.transaction-item')?.click();
    expect(component.edit.emit).toHaveBeenCalledWith('tx-1');
  });
});
