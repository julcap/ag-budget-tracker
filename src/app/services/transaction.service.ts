import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, tap } from 'rxjs';
import { Transaction, TransactionDraft, TransactionType, transactionType } from '../models/transaction';
import { UNCATEGORIZED } from '../models/category';
import { whenSignedIn } from './session';
import { isSameMonth, parseTransactionDate } from '../utils/date';
import { environment } from '../../environments/environment';

const API = `${environment.apiUrl}/budget-tracker/transactions`;

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private http = inject(HttpClient);
  private _transactions = signal<Transaction[]>([]);

  readonly transactions = this._transactions.asReadonly();
  readonly loaded = signal(false);
  readonly error = signal('');

  readonly currentMonth = computed(() => {
    const now = new Date();
    return this._transactions().filter(t => isSameMonth(parseTransactionDate(t.date, now), now));
  });

  constructor() {
    whenSignedIn(() => this.load(), () => this.clear());
  }

  add(transaction: TransactionDraft) {
    return this.http.post<Transaction>(API, transaction).pipe(
      tap(created => this._transactions.update(list => [...list, created]))
    );
  }

  // PATCH instead of PUT because it's a partial update
  update(id: string, changes: Partial<TransactionDraft>) {
    return this.http.patch<Transaction>(`${API}/${encodeURIComponent(id)}`, changes).pipe(
      tap(updated => this.replace(updated))
    );
  }

  remove(id: string) {
    return this.http.delete<unknown>(`${API}/${encodeURIComponent(id)}`).pipe(
      tap(() => this._transactions.update(list => list.filter(t => t.id !== id))),
      map(() => undefined)
    );
  }

  markUncategorized(type: TransactionType, category: string) {
    this._transactions.update(list => list.map(t =>
      transactionType(t) === type && t.category === category ? { ...t, category: UNCATEGORIZED } : t));
  }

  private load() {
    this.http.get<Transaction[]>(API).subscribe({
      next: data => { this._transactions.set(data); this.loaded.set(true); },
      error: () => this.error.set('Unable to load transactions. Please reload to try again.')
    });
  }

  private clear() {
    this._transactions.set([]);
    this.loaded.set(false);
    this.error.set('');
  }

  private replace(updated: Transaction) {
    this._transactions.update(list => list.map(t => t.id === updated.id ? updated : t));
  }
}
