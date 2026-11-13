// Starting categories; users can add/remove their own in Settings (see CategoryService).
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
