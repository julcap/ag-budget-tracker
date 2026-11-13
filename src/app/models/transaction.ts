import { Category } from './category';
import { parseTransactionDate } from '../utils/date';

export type TransactionType = 'expense' | 'income';

export interface Transaction {
  id: string;
  type: TransactionType;
  merchant: string;
  category: Category | string;
  /** ISO `YYYY-MM-DD`. Older records may hold `Today` or `Sep 8`; see `parseTransactionDate`. */
  date: string;
  amount: number;
  notes?: string;
}

export type TransactionDraft = Omit<Transaction, 'id'>;

// Older records may lack `type`; fall back to the sign of the amount.
export function transactionType(transaction: Pick<Transaction, 'type' | 'amount'>): TransactionType {
  return transaction.type ?? (transaction.amount < 0 ? 'expense' : 'income');
}

/** Amount with the sign implied by its type (expenses negative), regardless of how it was stored. */
export function signedAmount(transaction: Pick<Transaction, 'type' | 'amount'>): number {
  const magnitude = Math.abs(transaction.amount);
  return transactionType(transaction) === 'expense' ? -magnitude : magnitude;
}

/** Oldest first; negate for newest first. */
export function compareByDate(a: Pick<Transaction, 'date'>, b: Pick<Transaction, 'date'>): number {
  return parseTransactionDate(a.date).getTime() - parseTransactionDate(b.date).getTime();
}
