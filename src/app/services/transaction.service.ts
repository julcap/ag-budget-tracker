import {inject, Injectable, signal} from '@angular/core';
import {Transaction} from "../models/transaction";
import {HttpClient} from "@angular/common/http";
import {environment} from "../../environments/environment";

@Injectable({providedIn: 'root'})
export class TransactionService {
  private http = inject(HttpClient);
  private _transactions = signal<Transaction[]>([])

  transactions = this._transactions.asReadonly();

  constructor() {
    this.http.get<Transaction[]>(`${environment.apiUrl}/transactions`)
      .subscribe(data => this._transactions.set(data))
  }


  add(transaction: Omit<Transaction, 'id'>) {
    this.http.post<Transaction>(`${environment.apiUrl}/transactions`, transaction)
      .subscribe(created => {
        this._transactions.update(list => [...list, created]);
      });
  }

  // PATCH instead of PUT because it's a partial update
  update(id: string, changes: Partial<Omit<Transaction, 'id'>>) {
    this.http.patch<Transaction>(`${environment.apiUrl}/transactions/${id}`, changes)
      .subscribe(updated => this._transactions.update(list => list.map(t => t.id === id ? updated : t)))
  }
}
