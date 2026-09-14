import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap, throwError } from 'rxjs';
import { Budget } from '../models/budget';
import { environment } from '../../environments/environment';
import { CategoryService, UNCATEGORIZED } from './category.service';
import { TransactionService } from './transaction.service';

@Injectable({ providedIn: 'root' })
export class BudgetService {
  private http = inject(HttpClient);
  private categories = inject(CategoryService);
  private transactions = inject(TransactionService);
  private saved = signal<Budget[]>([]);
  readonly loaded = signal(false);
  readonly error = signal('');
  private expenses = computed(() => this.transactions.transactions().filter(t => {
    if ((t.type ?? (t.amount < 0 ? 'expense' : 'income')) !== 'expense') return false;
    const now = new Date();
    if (t.date === 'Today') return true;
    const date = new Date(/^\d{4}-/.test(t.date) ? `${t.date}T12:00:00` : `${t.date} ${now.getFullYear()}`);
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  }));
  readonly budgets = computed<Budget[]>(() => this.categories.expenseCategories().map(name => {
    const saved = this.saved().find(b => b.name === name && !this.isGlobal(b));
    return { id: saved?.id ?? `category:${name}`, name, limit: saved?.limit ? saved.limit : Infinity,
      spent: this.expenses().filter(t => (this.categories.isExpense(t.category) ? t.category : UNCATEGORIZED) === name)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0) };
  }));
  readonly globalBudget = computed<Budget>(() => ({
    id: 'global', name: 'Total expenses', limit: this.savedGlobal()?.limit ?? 0,
    spent: this.expenses().reduce((sum, t) => sum + Math.abs(t.amount), 0)
  }));

  private isGlobal(budget: Budget): boolean {
    return budget.scope === 'global' || budget.id === 'global' ||
      (!budget.scope && budget.name === 'Total expenses');
  }

  // Older saves received generated IDs. Prefer the most recent global record.
  private savedGlobal = computed(() => [...this.saved()].reverse().find(b => this.isGlobal(b)));

  constructor() {
    this.http.get<Budget[]>(`${environment.apiUrl}/budgets`).subscribe({
      next: data => { this.saved.set(data); this.loaded.set(true); },
      error: () => this.error.set('Unable to load budgets. Please reload to try again.')
    });
  }

  updateLimit(id: string, limit: number) {
    const budget = id === 'global' ? this.globalBudget() : this.budgets().find(b => b.id === id);
    if (!budget || !this.loaded() || !Number.isFinite(limit) || limit < 0) return throwError(() => new Error('Invalid budget limit'));
    const existing = id === 'global' ? this.savedGlobal() : this.saved().find(b => b.id === id);
    const scope = id === 'global' ? 'global' : 'category';
    const request = existing
      ? this.http.patch<Budget>(`${environment.apiUrl}/budgets/${encodeURIComponent(existing.id)}`, { limit, scope })
      : this.http.post<Budget>(`${environment.apiUrl}/budgets`, { name: budget.name, spent: budget.spent, limit, scope });
    return request.pipe(tap(saved => this.saved.update(list => [...list.filter(b => b.id !== saved.id), saved])));
  }
}
