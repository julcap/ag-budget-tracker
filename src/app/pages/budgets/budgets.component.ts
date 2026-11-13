import { Component, computed, inject, signal } from '@angular/core';
import { BudgetService } from '../../services/budget.service';
import { Budget } from '../../models/budget';
import { MoneyPipe } from '../../pipes/money.pipe';
import { formatMonth } from '../../utils/date';

@Component({
  selector: 'app-budgets', standalone: true, imports: [MoneyPipe],
  templateUrl: './budgets.component.html', styleUrl: './budgets.component.scss'
})
export class BudgetsComponent {
  private budgetService = inject(BudgetService);
  budgets = this.budgetService.budgets;
  cards = computed(() => [this.budgetService.globalBudget(), ...this.budgets()]);
  loaded = this.budgetService.loaded;
  loadError = this.budgetService.error;
  editingId = signal<string | null>(null);
  draftLimit = signal(0);
  saving = signal(false);
  error = signal('');
  validLimit = computed(() => Number.isFinite(this.draftLimit()) && this.draftLimit() >= 0);
  readonly month = formatMonth(new Date());

  toggleEdit(id: string) {
    this.error.set('');
    if (this.editingId() === id) { this.editingId.set(null); return; }
    this.editingId.set(id);
    const limit = this.cards().find(b => b.id === id)?.limit ?? 0;
    this.draftLimit.set(Number.isFinite(limit) ? limit : 0);
  }

  protected onDraftInput(event: Event) {
    this.draftLimit.set((event.target as HTMLInputElement).valueAsNumber);
  }

  saveLimit(id: string) {
    if (!this.validLimit() || this.saving()) return;
    this.saving.set(true);
    this.error.set('');
    this.budgetService.updateLimit(id, this.draftLimit()).subscribe({
      next: () => { this.saving.set(false); this.editingId.set(null); },
      error: () => { this.saving.set(false); this.error.set('Unable to save this budget. Please try again.'); }
    });
  }

  protected isUnlimited(b: Budget) { return b.limit === Infinity; }

  protected statusClass(b: Budget) {
    if (this.isUnlimited(b)) return 'unlimited';
    if (!b.limit) return 'unset';
    return b.spent > b.limit ? 'over' : b.spent >= b.limit * 0.7 ? 'near' : 'ok';
  }
  protected statusLabel(b: Budget) {
    return { unlimited: 'Unlimited', unset: 'Set a budget', over: 'Over budget', near: 'Near limit', ok: 'On track' }[this.statusClass(b)];
  }
  protected progressPct(b: Budget) { return b.limit > 0 ? Math.min(100, b.spent * 100 / b.limit) : 0; }
}
