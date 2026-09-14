import { TestBed } from '@angular/core/testing';
import { CategoryService } from './category.service';
import {
  ALL_CATEGORIES,
  DEFAULT_EXPENSE_CATEGORY,
  DEFAULT_INCOME_CATEGORY,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES
} from '../models/category';

describe('CategoryService', () => {
  let service: CategoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CategoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should expose expense, income and all categories as signals', () => {
    expect(service.expenseCategories()).toEqual(EXPENSE_CATEGORIES);
    expect(service.incomeCategories()).toEqual(INCOME_CATEGORIES);
    expect(service.allCategories()).toEqual(ALL_CATEGORIES);
  });

  it('should return appropriate categories for type', () => {
    expect(service.getCategories('expense')).toEqual(EXPENSE_CATEGORIES);
    expect(service.getCategories('income')).toEqual(INCOME_CATEGORIES);
  });

  it('should return default category for type', () => {
    expect(service.getDefaultCategory('expense')).toBe(DEFAULT_EXPENSE_CATEGORY);
    expect(service.getDefaultCategory('income')).toBe(DEFAULT_INCOME_CATEGORY);
  });

  it('should correctly identify expense and income categories', () => {
    expect(service.isExpense('Groceries')).toBeTrue();
    expect(service.isExpense('Salary')).toBeFalse();

    expect(service.isIncome('Salary')).toBeTrue();
    expect(service.isIncome('Rent')).toBeFalse();

    expect(service.isExpense('Other')).toBeTrue();
    expect(service.isIncome('Other')).toBeTrue();
  });
});
