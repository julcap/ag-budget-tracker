import { TransactionType } from './transaction';

// The default category lists live on the server (seeded per user on first use).
export const UNCATEGORIZED = 'Uncategorized';

export type CategoryLists = Record<TransactionType, string[]>;
