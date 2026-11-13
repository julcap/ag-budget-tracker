import { computed, Injectable, signal } from '@angular/core';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../models/category';
import { TransactionType } from '../models/transaction';

export const UNCATEGORIZED = 'Uncategorized';
const STORAGE_KEY = 'budget_categories';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private categories = signal(this.load());
  readonly expenseCategories = computed(() => this.categories().expense);
  readonly incomeCategories = computed(() => this.categories().income);
  readonly allCategories = computed(() => [...new Set([...this.expenseCategories(), ...this.incomeCategories()])]);

  getCategories(type: TransactionType): readonly string[] { return this.categories()[type]; }
  getDefaultCategory(type: TransactionType): string { return this.getCategories(type)[0]; }
  isExpense(category: string): boolean { return this.expenseCategories().includes(category); }
  isIncome(category: string): boolean { return this.incomeCategories().includes(category); }

  add(type: TransactionType, name: string): boolean {
    name = name.trim();
    if (!name || this.getCategories(type).some(c => c.toLowerCase() === name.toLowerCase())) return false;
    this.save(type, [...this.getCategories(type), name]);
    return true;
  }

  remove(type: TransactionType, name: string) {
    if (name !== UNCATEGORIZED) this.save(type, this.getCategories(type).filter(c => c !== name));
  }

  private save(type: TransactionType, names: readonly string[]) {
    const next = { ...this.categories(), [type]: names };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    this.categories.set(next);
  }

  private load(): Record<TransactionType, readonly string[]> {
    let stored: any;
    try { stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch { /* Use defaults. */ }
    const read = (type: TransactionType, defaults: readonly string[]) => {
      const names = Array.isArray(stored?.[type]) ? stored[type].filter((n: unknown) => typeof n === 'string' && n.trim()) : defaults;
      return [...new Set<string>([...names, UNCATEGORIZED])];
    };
    return { expense: read('expense', EXPENSE_CATEGORIES), income: read('income', INCOME_CATEGORIES) };
  }
}
