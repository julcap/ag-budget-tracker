export interface Transaction {
  id: string;
  type: 'expense' | 'income';
  merchant: string;
  category: string;
  date: string;
  amount: number;
  notes?: string;
}
