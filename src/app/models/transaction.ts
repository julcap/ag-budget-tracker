import { Category } from './category';

export interface Transaction {
  id: string;
  type: 'expense' | 'income';
  merchant: string;
  category: Category | string;
  date: string;
  amount: number;
  notes?: string;
}
