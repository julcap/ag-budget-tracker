import {Component, inject} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {TransactionService} from "../../services/transaction.service";

@Component({
  selector: 'app-transaction-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './transaction-form.component.html',
  styleUrl: './transaction-form.component.scss'
})
export class TransactionFormComponent {
  private transactionService = inject(TransactionService);

  form = new FormGroup({
    merchant: new FormControl('', {nonNullable: true, validators: Validators.required}),
    amount: new FormControl<number | null>(null, [Validators.required, Validators.min(0.01)]),
    category: new FormControl('Groceries', {nonNullable: true, validators: Validators.required})
  })

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const {merchant, amount, category} = this.form.getRawValue();
    this.transactionService.add({merchant, category, amount: -Math.abs(amount!), date: 'Today'})
    this.form.reset({merchant: '', amount: null, category: 'Groceries'})
  }

}
