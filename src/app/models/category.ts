export const EXPENSE_CATEGORIES = [
  'Groceries',
  'Rent',
  'Transport',
  'Entertainment',
  'Utilities',
  'Other'
] as const;

export const INCOME_CATEGORIES = [
  'Salary',
  'Freelance',
  'Investments',
  'Gift',
  'Other'
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
export type IncomeCategory = (typeof INCOME_CATEGORIES)[number];
export type Category = ExpenseCategory | IncomeCategory;
export type TransactionCategory = Category;

export const ALL_CATEGORIES: readonly string[] = Array.from(
  new Set<string>([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES])
);

export const DEFAULT_EXPENSE_CATEGORY: ExpenseCategory = 'Groceries';
export const DEFAULT_INCOME_CATEGORY: IncomeCategory = 'Salary';

export function getCategoriesForType(type: 'expense' | 'income'): readonly string[] {
  return type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
}

export function getDefaultCategoryForType(type: 'expense' | 'income'): string {
  return type === 'income' ? DEFAULT_INCOME_CATEGORY : DEFAULT_EXPENSE_CATEGORY;
}

export function isExpenseCategory(category: string): category is ExpenseCategory {
  return (EXPENSE_CATEGORIES as readonly string[]).includes(category);
}

export function isIncomeCategory(category: string): category is IncomeCategory {
  return (INCOME_CATEGORIES as readonly string[]).includes(category);
}
