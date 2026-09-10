import {Component, inject} from '@angular/core';
import {BalanceCardComponent} from "../../components/balance-card/balance-card.component";
import {TransactionRowComponent} from "../../components/transaction-row/transaction-row.component";
import {TransactionService} from "../../services/transaction.service";


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [BalanceCardComponent,TransactionRowComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})

export class DashboardComponent {
  private transactionService = inject(TransactionService);
  transactions = this.transactionService.transactions;
}
