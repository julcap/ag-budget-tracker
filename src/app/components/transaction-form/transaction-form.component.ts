import {Component, inject} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {TransactionService} from "../../services/transaction.service";
import {ActivatedRoute, Router} from "@angular/router";

@Component({
  selector: 'app-transaction-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './transaction-form.component.html',
  styleUrl: './transaction-form.component.scss'
})
export class TransactionFormComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private transactionService = inject(TransactionService);
  editingId: string | null = null;

  form = new FormGroup({
    merchant: new FormControl('', {nonNullable: true, validators: Validators.required}),
    amount: new FormControl<number | null>(null, [Validators.required]),
    category: new FormControl('Groceries', {nonNullable: true, validators: Validators.required})
  })

  ngOnInit() {
    this.editingId = this.route.snapshot.paramMap.get('id');
    if (this.editingId){
      const existing  = this.transactionService.transactions().find(t => t.id === this.editingId)
      if (existing){
        this.form.patchValue({
          merchant: existing.merchant,
          amount: existing.amount,
          category: existing.category
        })
      }
    }
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const {merchant, amount, category} = this.form.getRawValue();
    const roundedAmount = Math.round(amount! * 100) / 100;

    if (this.editingId) {
      this.transactionService.update(this.editingId, {merchant, category, amount: roundedAmount});
      this.router.navigate(['/transactions']);
    }else {
      this.transactionService.add({merchant, category, amount: roundedAmount, date: 'Today'})
      this.form.reset({merchant: '', amount: null, category: 'Groceries'})
    }
  }
}
