import {Component, inject} from '@angular/core';
import {TransactionService} from "../../services/transaction.service";
import {TransactionRowComponent} from "../../components/transaction-row/transaction-row.component";

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [
    TransactionRowComponent
  ],
  templateUrl: './transactions.component.html',
  styleUrl: './transactions.component.scss'
})
export class TransactionsComponent {
  private transactionsService = inject(TransactionService)
  transactions = this.transactionsService.transactions

}
