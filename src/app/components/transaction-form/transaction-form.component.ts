import { Component, effect, inject, input, OnInit, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { TransactionService } from "../../services/transaction.service";
import { CategoryService } from "../../services/category.service";
import { ActivatedRoute } from "@angular/router";
import {
  DEFAULT_EXPENSE_CATEGORY,
  DEFAULT_INCOME_CATEGORY,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES
} from "../../models/category";

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
  private categoryService = inject(CategoryService);

  transactionId = input<string | null>(null);
  dialogVisible = input(false);
  dialogClose = output<void>();

  editingId: string | null = null;

  expenseCategories = EXPENSE_CATEGORIES;
  incomeCategories = INCOME_CATEGORIES;

  get categories(): readonly string[] {
    return this.categoryService.getCategories(this.form.controls.type.value);
  }

  form = new FormGroup({
    type: new FormControl<'expense' | 'income'>('expense', {nonNullable: true, validators: Validators.required}),
    merchant: new FormControl('', {nonNullable: true, validators: Validators.required}),
    amount: new FormControl<number | null>(null, [Validators.required]),
    category: new FormControl<string>(DEFAULT_EXPENSE_CATEGORY, {nonNullable: true, validators: Validators.required}),
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
      const type = existing.type ?? (existing.amount < 0 ? 'expense' : 'income');
      this.form.patchValue({
        type,
        merchant: existing.merchant,
        amount: Math.abs(existing.amount),
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
      category: DEFAULT_EXPENSE_CATEGORY,
      date: 'Today',
      notes: ''
    });
  }

  setType(type: 'expense' | 'income') {
    this.form.controls.type.setValue(type);
    const currentCategory = this.form.controls.category.value;
    const availableCategories = this.categoryService.getCategories(type);
    if (!availableCategories.includes(currentCategory)) {
      this.form.controls.category.setValue(this.categoryService.getDefaultCategory(type));
    }
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
    const roundedAmount = Math.round(Math.abs(amount!) * 100) / 100;
    const finalAmount = type === 'expense' ? -roundedAmount : roundedAmount;

    const payload = {
      type,
      merchant,
      category,
      amount: finalAmount,
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
