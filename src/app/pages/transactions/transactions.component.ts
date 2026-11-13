import { Component, computed, inject, signal } from '@angular/core';
import { TransactionService } from '../../services/transaction.service';
import { CategoryService } from '../../services/category.service';
import { TransactionFormComponent } from '../../components/transaction-form/transaction-form.component';
import { BackdropComponent } from '../../UI/backdrop/backdrop.component';
import { compareByDate, signedAmount, Transaction } from '../../models/transaction';
import { MoneyPipe } from '../../pipes/money.pipe';
import { DisplayDatePipe } from '../../pipes/display-date.pipe';

type SortField = 'date' | 'merchant' | 'category' | 'amount';
type SortDirection = 'asc' | 'desc';

const ALL = 'All';

const COMPARATORS: Record<SortField, (a: Transaction, b: Transaction) => number> = {
  date: compareByDate,
  merchant: (a, b) => a.merchant.localeCompare(b.merchant),
  category: (a, b) => a.category.localeCompare(b.category),
  amount: (a, b) => signedAmount(a) - signedAmount(b)
};

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [TransactionFormComponent, BackdropComponent, MoneyPipe, DisplayDatePipe],
  templateUrl: './transactions.component.html',
  styleUrl: './transactions.component.scss'
})
export class TransactionsComponent {
  private transactionsService = inject(TransactionService);
  private categoryService = inject(CategoryService);

  readonly transactions = this.transactionsService.transactions;
  readonly loadError = this.transactionsService.error;
  readonly signedAmount = signedAmount;
  readonly columns: { field: SortField; label: string; numeric?: boolean }[] = [
    { field: 'date', label: 'Date' },
    { field: 'merchant', label: 'Merchant' },
    { field: 'category', label: 'Category' },
    { field: 'amount', label: 'Amount', numeric: true }
  ];

  categories = computed(() => [ALL, ...this.categoryService.allCategories()]);
  activeCategory = signal(ALL);
  query = signal('');
  sortField = signal<SortField>('date');
  sortDirection = signal<SortDirection>('desc');

  dialogVisible = signal(false);
  editingTransactionId = signal<string | null>(null);

  filteredTransactions = computed(() => {
    const q = this.query().trim().toLowerCase();
    const category = this.activeCategory();
    const compare = COMPARATORS[this.sortField()];
    const direction = this.sortDirection() === 'asc' ? 1 : -1;

    return this.transactions()
      .filter(t =>
        (category === ALL || t.category === category) &&
        (!q || [t.merchant, t.category, t.notes ?? ''].some(text => text.toLowerCase().includes(q))))
      .sort((a, b) => direction * compare(a, b));
  });

  filteredTotal = computed(() => this.filteredTransactions().reduce((sum, t) => sum + signedAmount(t), 0));

  handleSearch(event: Event) {
    this.query.set((event.target as HTMLInputElement).value);
  }

  setCategory(category: string) {
    this.activeCategory.set(category);
  }

  clearFilters() {
    this.query.set('');
    this.activeCategory.set(ALL);
  }

  toggleSort(field: SortField) {
    if (this.sortField() === field) {
      this.sortDirection.update(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortField.set(field);
      this.sortDirection.set(field === 'date' || field === 'amount' ? 'desc' : 'asc');
    }
  }

  ariaSort(field: SortField) {
    if (this.sortField() !== field) return 'none';
    return this.sortDirection() === 'asc' ? 'ascending' : 'descending';
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
  }
}
