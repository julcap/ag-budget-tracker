import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TransactionsComponent } from './transactions.component';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { TransactionService } from '../../services/transaction.service';
import { CategoryService } from '../../services/category.service';

describe('TransactionsComponent', () => {
  let component: TransactionsComponent;
  let fixture: ComponentFixture<TransactionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransactionsComponent],
      providers: [
        provideHttpClient(),
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TransactionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have global categories available in category filter list', () => {
    const categories = TestBed.inject(CategoryService);
    expect(component.categories).toEqual(['All', ...categories.allCategories()]);
    categories.add('expense', 'Healthcare');
    expect(component.categories).toContain('Healthcare');
    categories.remove('expense', 'Healthcare');
    expect(component.categories).not.toContain('Healthcare');
    expect(component.categories).toContain('Uncategorized');
  });

  it('should filter transactions by search query', () => {
    component.query.set('market');
    expect(component.query()).toBe('market');
  });

  it('should filter transactions by category', () => {
    component.setCategory('Groceries');
    expect(component.activeCategory()).toBe('Groceries');
  });

  it('should toggle sort field and direction', () => {
    component.toggleSort('amount');
    expect(component.sortField()).toBe('amount');
    expect(component.sortDirection()).toBe('asc');

    component.toggleSort('amount');
    expect(component.sortDirection()).toBe('desc');
  });

  it('should open and close modal dialog', () => {
    component.onAddRequested();
    expect(component.dialogVisible()).toBeTrue();
    expect(component.editingTransactionId()).toBeNull();

    component.onEditRequested('tx-123');
    expect(component.dialogVisible()).toBeTrue();
    expect(component.editingTransactionId()).toBe('tx-123');

    component.closeDialog();
    expect(component.dialogVisible()).toBeFalse();
    expect(component.editingTransactionId()).toBeNull();
  });
});
