import { Component, computed, input, output } from '@angular/core';
import { signedAmount, Transaction } from '../../models/transaction';
import { MoneyPipe } from '../../pipes/money.pipe';
import { DisplayDatePipe } from '../../pipes/display-date.pipe';

@Component({
  selector: 'app-transaction-row',
  standalone: true,
  imports: [MoneyPipe, DisplayDatePipe],
  templateUrl: './transaction-row.component.html',
  styleUrl: './transaction-row.component.scss'
})
export class TransactionRowComponent {
  transaction = input.required<Transaction>();
  edit = output<string>();
  amount = computed(() => signedAmount(this.transaction()));
}
