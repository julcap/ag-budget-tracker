import { Injectable, signal } from '@angular/core';
import {
  ALL_CATEGORIES,
  Category,
  DEFAULT_EXPENSE_CATEGORY,
  DEFAULT_INCOME_CATEGORY,
  EXPENSE_CATEGORIES,
  ExpenseCategory,
  getCategoriesForType,
  getDefaultCategoryForType,
  INCOME_CATEGORIES,
  IncomeCategory,
  isExpenseCategory,
  isIncomeCategory
} from '../models/category';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  readonly expenseCategories = signal<readonly ExpenseCategory[]>(EXPENSE_CATEGORIES);
  readonly incomeCategories = signal<readonly IncomeCategory[]>(INCOME_CATEGORIES);
  readonly allCategories = signal<readonly string[]>(ALL_CATEGORIES);

  getCategories(type: 'expense' | 'income'): readonly string[] {
    return getCategoriesForType(type);
  }

  getDefaultCategory(type: 'expense' | 'income'): string {
    return getDefaultCategoryForType(type);
  }

  isExpense(category: string): boolean {
    return isExpenseCategory(category);
  }

  isIncome(category: string): boolean {
    return isIncomeCategory(category);
  }
}
