import { Component, effect, inject, input, OnInit, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { TransactionService } from "../../services/transaction.service";
import { ActivatedRoute } from "@angular/router";

@Component({
  selector: 'app-transaction-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './transaction-form.component.html',
  styleUrl: './transaction-form.component.scss'
})
export class TransactionFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private transactionService = inject(TransactionService);

  transactionId = input<string | null>(null);
  dialogVisible = input(false);
  dialogClose = output<void>();

  editingId: string | null = null;

  form = new FormGroup({
    type: new FormControl<'expense' | 'income'>('expense', {nonNullable: true, validators: Validators.required}),
    merchant: new FormControl('', {nonNullable: true, validators: Validators.required}),
    amount: new FormControl<number | null>(null, [Validators.required]),
    category: new FormControl('Groceries', {nonNullable: true, validators: Validators.required}),
    date: new FormControl('Today', {nonNullable: true, validators: Validators.required}),
    notes: new FormControl('')
  });

  constructor() {
    effect(() => {
      const id = this.transactionId();
      if (id) {
        this.loadTransaction(id);
      } else if (id === null && !this.route.snapshot?.paramMap?.get('id')) {
        this.editingId = null;
        this.resetForm();
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit() {
    const routeId = this.route.snapshot?.paramMap?.get('id');
    if (routeId) {
      this.loadTransaction(routeId);
    }
  }

  loadTransaction(id: string) {
    this.editingId = id;
    const existing = this.transactionService.transactions().find(t => t.id === id);
    if (existing) {
      this.form.patchValue({
        type: existing.type ?? 'expense',
        merchant: existing.merchant,
        amount: existing.amount,
        category: existing.category,
        date: existing.date,
        notes: existing.notes ?? ''
      });
    }
  }

  resetForm() {
    this.form.reset({
      type: 'expense',
      merchant: '',
      amount: null,
      category: 'Groceries',
      date: 'Today',
      notes: ''
    });
  }

  setType(type: 'expense' | 'income') {
    this.form.controls.type.setValue(type);
  }

  cancel() {
    this.editingId = null;
    this.resetForm();
    this.dialogClose.emit();
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
    } else {
      this.transactionService.add(payload);
    }
    this.resetForm();
    this.dialogClose.emit();
  }
}
