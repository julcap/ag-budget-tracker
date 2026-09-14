import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransactionService } from '../../services/transaction.service';
import { TransactionFormComponent } from '../../components/transaction-form/transaction-form.component';
import { BackdropComponent } from '../../UI/backdrop/backdrop.component';
import { Transaction } from '../../models/transaction';

type SortField = 'date' | 'merchant' | 'category' | 'amount';
type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TransactionFormComponent,
    BackdropComponent,
    CurrencyPipe
  ],
  templateUrl: './transactions.component.html',
  styleUrl: './transactions.component.scss'
})
export class TransactionsComponent {
  private transactionsService = inject(TransactionService);
  transactions = this.transactionsService.transactions;

  categories = ['All', 'Groceries', 'Rent', 'Transport', 'Entertainment', 'Utilities', 'Income'];
  activeCategory = signal<string>('All');
  query = signal<string>('');
  sortField = signal<SortField>('date');
  sortDirection = signal<SortDirection>('desc');

  dialogVisible = signal<boolean>(false);
  editingTransactionId = signal<string | null>(null);

  filteredTransactions = computed(() => {
    const q = this.query().trim().toLowerCase();
    const cat = this.activeCategory();
    const field = this.sortField();
    const dir = this.sortDirection();

    let list = this.transactions().filter(t => {
      const matchesCategory = cat === 'All' || t.category.toLowerCase() === cat.toLowerCase();
      const matchesQuery = !q ||
        t.merchant.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        (t.notes && t.notes.toLowerCase().includes(q));
      return matchesCategory && matchesQuery;
    });

    return list.sort((a, b) => {
      let comparison = 0;
      if (field === 'amount') {
        comparison = a.amount - b.amount;
      } else if (field === 'merchant') {
        comparison = a.merchant.localeCompare(b.merchant);
      } else if (field === 'category') {
        comparison = a.category.localeCompare(b.category);
      } else {
        comparison = a.date.localeCompare(b.date);
      }
      return dir === 'asc' ? comparison : -comparison;
    });
  });

  handleSearch(event: Event) {
    this.query.set((event.target as HTMLInputElement).value);
  }

  setCategory(category: string) {
    this.activeCategory.set(category);
  }

  toggleSort(field: SortField) {
    if (this.sortField() === field) {
      this.sortDirection.update(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortField.set(field);
      this.sortDirection.set('asc');
    }
  }

  onAddRequested() {
    this.editingTransactionId.set(null);
    this.dialogVisible.set(true);
  }

  onEditRequested(id: string) {
    this.editingTransactionId.set(id);
    this.dialogVisible.set(true);
  }

  closeDialog() {
    this.dialogVisible.set(false);
    this.editingTransactionId.set(null);
  }

  formatAmount(amount: number, type?: string): string {
    const isIncome = type === 'income' || amount > 0;
    const formatted = Math.abs(amount).toFixed(2);
    return isIncome ? `+$${formatted}` : `-$${formatted}`;
  }
}
