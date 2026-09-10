import {Component, inject} from '@angular/core';
import {BalanceCardComponent} from "./components/balance-card/balance-card.component";
import {TransactionRowComponent} from "./components/transaction-row/transaction-row.component";
import {TransactionService} from "./services/transaction.service";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [BalanceCardComponent,TransactionRowComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})

export class AppComponent {
 private transactionService = inject(TransactionService);
 transactions = this.transactionService.transactions;
}
