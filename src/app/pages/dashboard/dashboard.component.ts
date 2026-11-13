import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BalanceCardComponent, ValueTone } from '../../components/balance-card/balance-card.component';
import { TransactionRowComponent } from '../../components/transaction-row/transaction-row.component';
import { TransactionFormComponent } from '../../components/transaction-form/transaction-form.component';
import { BackdropComponent } from '../../UI/backdrop/backdrop.component';
import { TransactionService } from '../../services/transaction.service';
import { SettingsService } from '../../services/settings.service';
import { compareByDate, signedAmount, transactionType } from '../../models/transaction';
import { MoneyPipe } from '../../pipes/money.pipe';
import { formatMonth } from '../../utils/date';
import { formatMoney } from '../../utils/money';

export interface CategorySpendingItem {
  name: string;
  amount: number;
  /** Bar width relative to the largest category. */
  pct: number;
  /** Share of this month's total spending. */
  share: number;
}

const RECENT_COUNT = 5;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [BalanceCardComponent, TransactionRowComponent, TransactionFormComponent, BackdropComponent, MoneyPipe, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent {
  private transactionService = inject(TransactionService);
  private settings = inject(SettingsService);

  readonly transactions = this.transactionService.transactions;
  readonly loadError = this.transactionService.error;
  readonly month = formatMonth(new Date());

  activeCategory = signal<string | null>(null);
  dialogVisible = signal(false);
  editingTransactionId = signal<string | null>(null);

  balanceValue = computed(() => this.transactions().reduce((sum, t) => sum + signedAmount(t), 0));

  private monthTotals = computed(() => {
    let income = 0;
    let spent = 0;
    for (const t of this.transactionService.currentMonth()) {
      if (transactionType(t) === 'income') income += Math.abs(t.amount);
      else spent += Math.abs(t.amount);
    }
    return { income, spent };
  });

  balance = computed(() => this.format(this.balanceValue()));
  incomeThisMonth = computed(() => this.format(this.monthTotals().income));
  spentThisMonth = computed(() => this.format(this.monthTotals().spent));
  balanceTone = computed<ValueTone | null>(() => this.balanceValue() < 0 ? 'danger' : null);

  /** Spent / income; any spending with no income counts as over 100%. */
  spentRatio = computed(() => {
    const { income, spent } = this.monthTotals();
    if (income <= 0) return spent > 0 ? Infinity : 0;
    return spent / income;
  });

  spentTone = computed<ValueTone | null>(() => {
    const ratio = this.spentRatio();
    if (ratio > this.settings.spendingDangerPercent() / 100) return 'danger';
    if (ratio > this.settings.spendingWarningPercent() / 100) return 'warn';
    return null;
  });

  isSpentWarningIcon = computed(() =>
    this.spentRatio() > 0 && this.spentRatio() >= this.settings.spendingWarningIconPercent() / 100);

  categorySpending = computed<CategorySpendingItem[]>(() => {
    const totals = new Map<string, number>();
    for (const t of this.transactionService.currentMonth()) {
      if (transactionType(t) !== 'expense') continue;
      totals.set(t.category, (totals.get(t.category) ?? 0) + Math.abs(t.amount));
    }
    const entries = [...totals.entries()].sort((a, b) => b[1] - a[1]);
    const max = Math.max(...entries.map(([, amount]) => amount), 1);
    const total = entries.reduce((sum, [, amount]) => sum + amount, 0);
    return entries.map(([name, amount]) => ({
      name,
      amount,
      pct: Math.round((amount / max) * 100),
      share: total ? Math.round((amount / total) * 100) : 0
    }));
  });

  activeCategoryDetail = computed(() => {
    const item = this.categorySpending().find(c => c.name === this.activeCategory());
    if (!item) return 'Select a category to see its share of spending';
    return `${item.name}: ${this.format(item.amount)} · ${item.share}% of spending this month`;
  });

  recentTransactions = computed(() =>
    [...this.transactions()].sort((a, b) => compareByDate(b, a)).slice(0, RECENT_COUNT));

  toggleCategory(name: string) {
    this.activeCategory.update(current => current === name ? null : name);
  }

  openAdd() {
    this.editingTransactionId.set(null);
    this.dialogVisible.set(true);
  }

  openEdit(id: string) {
    this.editingTransactionId.set(id);
    this.dialogVisible.set(true);
  }

  closeDialog() {
    this.dialogVisible.set(false);
  }

  private format(amount: number): string {
    return formatMoney(amount, this.settings.currency());
  }
}
