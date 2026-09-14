import { Component, computed, inject } from '@angular/core';
import { BalanceCardComponent } from "../../components/balance-card/balance-card.component";
import { TransactionRowComponent } from "../../components/transaction-row/transaction-row.component";
import { TransactionService } from "../../services/transaction.service";
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [BalanceCardComponent, TransactionRowComponent, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  private transactionService = inject(TransactionService);
  transactions = this.transactionService.transactions;

  balance = computed(() => {
    const list = this.transactions();
    if (list.length === 0) return '$2,450.00';
    const total = list.reduce((sum, t) => sum + t.amount, 0);
    return this.formatCurrency(total);
  });

  incomeThisMonth = computed(() => {
    const list = this.transactions();
    if (list.length === 0) return '$4,200.00';
    const total = list
      .filter(t => t.amount > 0 || t.type === 'income')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    return this.formatCurrency(total);
  });

  spentThisMonth = computed(() => {
    const list = this.transactions();
    if (list.length === 0) return '$1,750.00';
    const total = list
      .filter(t => t.amount < 0 || t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    return this.formatCurrency(total);
  });

  recentTransactions = computed(() => {
    return this.transactions().slice(0, 6);
  });

  private formatCurrency(amount: number): string {
    return `$${Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}
