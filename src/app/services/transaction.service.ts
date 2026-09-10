import {Injectable, signal} from '@angular/core';
import {Transaction} from "../models/transaction";

@Injectable({  providedIn: 'root'})
export class TransactionService {
  constructor() { }
  private _transactions = signal<Transaction[]>([
    { id: 1, merchant: 'Whole Foods Market', category: 'Groceries', date: 'Sep 8', amount: -84.20 },
    { id: 2, merchant: 'Spotify', category: 'Entertainment', date: 'Sep 7', amount: -11.99 },
    { id: 3, merchant: 'Acme Corp Payroll', category: 'Income', date: 'Sep 6', amount: 2100.00 },
  ]);
  transactions = this._transactions.asReadonly();
}
