import {Component, computed, inject, signal} from '@angular/core';
import {TransactionService} from "../../services/transaction.service";
import {TransactionRowComponent} from "../../components/transaction-row/transaction-row.component";
import {FormsModule} from "@angular/forms";
import {TransactionFormComponent} from "../../components/transaction-form/transaction-form.component";
import {Router} from "@angular/router";

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [FormsModule,
    TransactionRowComponent, TransactionFormComponent
  ],
  templateUrl: './transactions.component.html',
  styleUrl: './transactions.component.scss'
})
export class TransactionsComponent {
  private transactionsService = inject(TransactionService)
  transactions = this.transactionsService.transactions
  private router = inject(Router)

  query = signal('')

  filteredTransactions = computed(() => {
    const q = this.query().toLocaleLowerCase()
    return this.transactions().filter(t => t.merchant.toLocaleLowerCase().includes(q))
  })

  handleSearch(event: Event) {
    this.query.set((event.target as HTMLInputElement).value)
  }

  name = '';

  protected onEditRequested(id: string) {
    this.router.navigate(['transactions', id,'edit'])
  }
}
