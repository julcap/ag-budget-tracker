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
    type: new FormControl<'expense' | 'income'>('expense', {nonNullable: true, validators: Validators.required}),
    merchant: new FormControl('', {nonNullable: true, validators: Validators.required}),
    amount: new FormControl<number | null>(null, [Validators.required]),
    category: new FormControl('Groceries', {nonNullable: true, validators: Validators.required}),
    date: new FormControl('Today', {nonNullable: true, validators: Validators.required}),
    notes: new FormControl('')
  })

  setType(type: 'expense' | 'income') {
    this.form.controls.type.setValue(type);
  }

  ngOnInit() {
    this.editingId = this.route.snapshot.paramMap.get('id');
    if (this.editingId){
      const existing  = this.transactionService.transactions().find(t => t.id === this.editingId)
      if (existing){
        this.form.patchValue({
          type: existing.type ?? 'expense',
          merchant: existing.merchant,
          amount: existing.amount,
          category: existing.category,
          date: existing.date,
          notes: existing.notes ?? ''
        })
      }
    }
  }

  cancel() {
    this.editingId = null;
    this.form.reset({type: 'expense', merchant: '', amount: null, category: 'Groceries', date: 'Today', notes: ''});
    this.router.navigate(['/transactions']);
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const {type, merchant, amount, category, date, notes} = this.form.getRawValue();
    const roundedAmount = Math.round(amount! * 100) / 100;

    const payload = {
      type,
      merchant,
      category,
      amount: roundedAmount,
      date,
      ...(notes ? { notes } : {})
    };

    if (this.editingId) {
      this.transactionService.update(this.editingId, payload);
      this.router.navigate(['/transactions']);
    } else {
      this.transactionService.add(payload);
      this.form.reset({type: 'expense', merchant: '', amount: null, category: 'Groceries', date: 'Today', notes: ''});
    }
  }
}
