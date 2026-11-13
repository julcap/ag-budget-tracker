import { Component, computed, inject, input, OnInit, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { TransactionService } from '../../services/transaction.service';
import { CategoryService } from '../../services/category.service';
import { SettingsService } from '../../services/settings.service';
import { TransactionDraft, TransactionType, transactionType } from '../../models/transaction';
import { parseTransactionDate, todayIsoDate, toIsoDate } from '../../utils/date';
import { currencySymbol } from '../../utils/money';

@Component({
  selector: 'app-transaction-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './transaction-form.component.html',
  styleUrl: './transaction-form.component.scss'
})
export class TransactionFormComponent implements OnInit {
  private transactionService = inject(TransactionService);
  private categoryService = inject(CategoryService);
  private settings = inject(SettingsService);

  /** Id of the transaction to edit; `null` adds a new one. */
  transactionId = input<string | null>(null);
  dialogClose = output<void>();

  editingId: string | null = null;
  readonly busy = signal(false);
  readonly error = signal('');
  readonly confirmingDelete = signal(false);
  readonly currencySymbol = computed(() => currencySymbol(this.settings.currency()));

  form = new FormGroup({
    type: new FormControl<TransactionType>('expense', { nonNullable: true, validators: Validators.required }),
    merchant: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/\S/)] }),
    amount: new FormControl<number | null>(null, [Validators.required, Validators.min(0.01)]),
    category: new FormControl(this.categoryService.getDefaultCategory('expense'), { nonNullable: true, validators: Validators.required }),
    date: new FormControl(todayIsoDate(), { nonNullable: true, validators: Validators.required }),
    notes: new FormControl('', { nonNullable: true })
  });

  get categories(): readonly string[] {
    return this.categoryService.getCategories(this.form.controls.type.value);
  }

  ngOnInit() {
    const id = this.transactionId();
    if (id) this.loadTransaction(id);
  }

  loadTransaction(id: string) {
    const existing = this.transactionService.transactions().find(t => t.id === id);
    if (!existing) return;
    this.editingId = id;
    const date = parseTransactionDate(existing.date);
    this.form.setValue({
      type: transactionType(existing),
      merchant: existing.merchant,
      amount: Math.abs(existing.amount),
      category: existing.category,
      date: isNaN(date.getTime()) ? todayIsoDate() : toIsoDate(date),
      notes: existing.notes ?? ''
    });
  }

  setType(type: TransactionType) {
    this.form.controls.type.setValue(type);
    if (!this.categoryService.getCategories(type).includes(this.form.controls.category.value)) {
      this.form.controls.category.setValue(this.categoryService.getDefaultCategory(type));
    }
  }

  cancel() {
    this.dialogClose.emit();
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { type, merchant, amount, category, date, notes } = this.form.getRawValue();
    const rounded = Math.round(Math.abs(amount!) * 100) / 100;
    const payload: TransactionDraft = {
      type,
      merchant: merchant.trim(),
      category,
      amount: type === 'expense' ? -rounded : rounded,
      date,
      ...(notes.trim() ? { notes: notes.trim() } : {})
    };
    const request = this.editingId
      ? this.transactionService.update(this.editingId, payload)
      : this.transactionService.add(payload);
    this.run(request, 'Could not save the transaction. Please try again.');
  }

  delete() {
    if (!this.editingId) return;
    if (!this.confirmingDelete()) {
      this.confirmingDelete.set(true);
      return;
    }
    this.run(this.transactionService.remove(this.editingId), 'Could not delete the transaction. Please try again.');
  }

  private run(request: Observable<unknown>, failureMessage: string) {
    this.busy.set(true);
    this.error.set('');
    request.subscribe({
      next: () => this.dialogClose.emit(),
      error: () => {
        this.busy.set(false);
        this.confirmingDelete.set(false);
        this.error.set(failureMessage);
      }
    });
  }
}
