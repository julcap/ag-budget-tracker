import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { BalanceCardComponent } from "../../components/balance-card/balance-card.component";
import { TransactionService } from "../../services/transaction.service";
import { SettingsService } from "../../services/settings.service";
import { RouterLink } from '@angular/router';

export interface CategorySpendingItem {
  name: string;
  amount: number;
  formattedAmount: string;
  pct: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [BalanceCardComponent, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent {
  private transactionService = inject(TransactionService);
  private settingsService = inject(SettingsService);
  transactions = this.transactionService.transactions;
  Math = Math;

  activeCategory = signal<string | null>(null);
  selectedTxId = signal<string | null>(null);

  balanceValue = computed(() => {
    const list = this.transactions();
    if (list.length === 0) return 2450.00;
    return list.reduce((sum, t) => sum + t.amount, 0);
  });

  isBalanceNegative = computed(() => {
    return this.balanceValue() < 0;
  });

  balance = computed(() => {
    const val = this.balanceValue();
    const prefix = val < 0 ? '-$' : '$';
    return `${prefix}${Math.abs(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  });

  incomeThisMonthValue = computed(() => {
    const list = this.transactions();
    if (list.length === 0) return 4200.00;
    return list
      .filter(t => t.amount > 0 || t.type === 'income')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  });

  incomeThisMonth = computed(() => {
    return this.formatCurrency(this.incomeThisMonthValue());
  });

  spentThisMonthValue = computed(() => {
    const list = this.transactions();
    if (list.length === 0) return 1750.00;
    return list
      .filter(t => t.amount < 0 || t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  });

  spentThisMonth = computed(() => {
    return this.formatCurrency(this.spentThisMonthValue());
  });

  spentRatio = computed(() => {
    const income = this.incomeThisMonthValue();
    const spent = this.spentThisMonthValue();
    if (income <= 0) {
      return spent > 0 ? 1.01 : 0;
    }
    return spent / income;
  });

  isSpentDanger = computed(() => {
    const dangerRatio = this.settingsService.spendingDangerPercent() / 100;
    return this.spentRatio() > dangerRatio;
  });

  isSpentWarning = computed(() => {
    const warningRatio = this.settingsService.spendingWarningPercent() / 100;
    return this.spentRatio() > warningRatio;
  });

  isSpentWarningIcon = computed(() => {
    const iconRatio = this.settingsService.spendingWarningIconPercent() / 100;
    return this.spentRatio() >= iconRatio;
  });

  spentValueColor = computed<'red' | 'orange' | null>(() => {
    if (this.isSpentDanger()) {
      return 'red';
    }
    if (this.isSpentWarning()) {
      return 'orange';
    }
    return null;
  });

  categorySpending = computed<CategorySpendingItem[]>(() => {
    const list = this.transactions();
    const expenseList = list.filter(t => t.amount < 0 || t.type === 'expense');

    let categoryMap: { name: string; amount: number }[] = [];

    if (expenseList.length > 0) {
      const map = new Map<string, number>();
      for (const t of expenseList) {
        const cat = t.category || 'Other';
        const amt = Math.abs(t.amount);
        map.set(cat, (map.get(cat) || 0) + amt);
      }
      categoryMap = Array.from(map.entries())
        .map(([name, amount]) => ({ name, amount: Math.round(amount * 100) / 100 }))
        .sort((a, b) => b.amount - a.amount);
    } else {
      categoryMap = [
        { name: 'Rent', amount: 980 },
        { name: 'Groceries', amount: 420 },
        { name: 'Transport', amount: 180 },
        { name: 'Utilities', amount: 96 },
        { name: 'Entertainment', amount: 74 }
      ];
    }

    const max = Math.max(...categoryMap.map(c => c.amount), 1);

    return categoryMap.map(c => ({
      name: c.name,
      amount: c.amount,
      formattedAmount: '$' + (Number.isInteger(c.amount) ? c.amount.toLocaleString('en-US') : c.amount.toFixed(2)),
      pct: Math.round((c.amount / max) * 100)
    }));
  });

  totalCategorySpending = computed(() => {
    return this.categorySpending().reduce((sum, c) => sum + c.amount, 0);
  });

  activeCategoryDetail = computed(() => {
    const active = this.activeCategory();
    const cats = this.categorySpending();
    const total = this.totalCategorySpending();

    if (!active) {
      return 'Click a category to see its share of spending';
    }

    const item = cats.find(c => c.name.toLowerCase() === active.toLowerCase());
    if (!item || total === 0) {
      return 'Click a category to see its share of spending';
    }

    const pct = Math.round((item.amount / total) * 100);
    const formatted = '$' + (Number.isInteger(item.amount) ? item.amount.toLocaleString('en-US') : item.amount.toFixed(2));
    return `${item.name}: ${formatted} · ${pct}% of spending this month`;
  });

  recentTransactions = computed(() => {
    const list = this.transactions();
    if (list.length === 0) {
      return [
        { id: '1', merchant: 'Whole Foods Market', category: 'Groceries', date: 'Sep 8', amount: -84.20, type: 'expense' as const },
        { id: '2', merchant: 'Spotify', category: 'Entertainment', date: 'Sep 7', amount: -11.99, type: 'expense' as const },
        { id: '3', merchant: 'Acme Corp Payroll', category: 'Income', date: 'Sep 6', amount: 2100.00, type: 'income' as const },
        { id: '4', merchant: 'Shell Gas Station', category: 'Transport', date: 'Sep 5', amount: -52.30, type: 'expense' as const },
        { id: '5', merchant: 'Rent Payment', category: 'Rent', date: 'Sep 3', amount: -1450.00, type: 'expense' as const }
      ];
    }
    return list.slice(0, 5);
  });

  toggleCategory(name: string) {
    this.activeCategory.update(cur => cur === name ? null : name);
  }

  toggleSelectedTx(id: string) {
    this.selectedTxId.update(cur => cur === id ? null : id);
  }

  private formatCurrency(amount: number): string {
    return `$${Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}
