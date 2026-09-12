import {Component, input, output} from '@angular/core';
import {Transaction} from "../../models/transaction";
import {CurrencyPipe} from "@angular/common";

@Component({
  selector: 'app-transaction-row',
  standalone: true,
  imports: [CurrencyPipe],
  templateUrl: './transaction-row.component.html',
  styleUrl: './transaction-row.component.scss'
})

export class TransactionRowComponent {
transaction = input.required<Transaction>();
  edit = output<string>();
}
