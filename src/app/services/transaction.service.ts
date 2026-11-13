import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, map, of, switchMap, tap } from 'rxjs';
import { Transaction, TransactionDraft, TransactionType, transactionType } from '../models/transaction';
import { UNCATEGORIZED } from './category.service';
import { isSameMonth, parseTransactionDate } from '../utils/date';
import { environment } from '../../environments/environment';

const API = `${environment.apiUrl}/transactions`;

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
    this.http.get<Transaction[]>(API).subscribe({
      next: data => { this._transactions.set(data); this.loaded.set(true); },
      error: () => this.error.set('Unable to load transactions. Is the API running?')
    });
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

  reassignCategory(type: TransactionType, category: string) {
    return this.http.get<Transaction[]>(API).pipe(
      switchMap(transactions => {
        const related = transactions.filter(t => transactionType(t) === type && t.category === category);
        return related.length
          ? forkJoin(related.map(t => this.update(t.id, { category: UNCATEGORIZED })))
          : of([]);
      })
    );
  }

  private replace(updated: Transaction) {
    this._transactions.update(list => list.map(t => t.id === updated.id ? updated : t));
  }
}
