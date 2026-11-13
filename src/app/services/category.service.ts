import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { CategoryLists } from '../models/category';
import { TransactionType } from '../models/transaction';
import { TransactionService } from './transaction.service';
import { whenSignedIn } from './session';
import { environment } from '../../environments/environment';

const API = `${environment.apiUrl}/budget-tracker/categories`;
const EMPTY: CategoryLists = { expense: [], income: [] };

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private http = inject(HttpClient);
  private transactions = inject(TransactionService);
  private categories = signal<CategoryLists>(EMPTY);

  readonly error = signal('');
  readonly expenseCategories = computed(() => this.categories().expense);
  readonly incomeCategories = computed(() => this.categories().income);
  readonly allCategories = computed(() => [...new Set([...this.expenseCategories(), ...this.incomeCategories()])]);

  constructor() {
    whenSignedIn(() => this.load(), () => this.categories.set(EMPTY));
  }

  getCategories(type: TransactionType): readonly string[] { return this.categories()[type]; }
  getDefaultCategory(type: TransactionType): string { return this.getCategories(type)[0] ?? ''; }
  isExpense(category: string): boolean { return this.expenseCategories().includes(category); }
  isIncome(category: string): boolean { return this.incomeCategories().includes(category); }

  add(type: TransactionType, name: string): Observable<CategoryLists> {
    return this.http.post<CategoryLists>(API, { type, name: name.trim() }).pipe(tap(lists => this.categories.set(lists)));
  }

  /** The server also moves the category's transactions to Uncategorized; mirror that locally. */
  remove(type: TransactionType, name: string): Observable<CategoryLists> {
    return this.http.delete<CategoryLists>(`${API}/${type}/${encodeURIComponent(name)}`).pipe(
      tap(lists => {
        this.categories.set(lists);
        this.transactions.markUncategorized(type, name);
      })
    );
  }

  private load() {
    this.error.set('');
    this.http.get<CategoryLists>(API).subscribe({
      next: lists => this.categories.set(lists),
      error: () => this.error.set('Unable to load categories.')
    });
  }
}
