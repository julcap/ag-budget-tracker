import {Component, inject, signal} from '@angular/core';
import {BudgetService} from "../../services/budget.service";
import {CurrencyPipe} from "@angular/common";
import {Budget} from "../../models/budget";

@Component({
  selector: 'app-budgets',
  standalone: true,
  imports: [
    CurrencyPipe
  ],
  templateUrl: './budgets.component.html',
  styleUrl: './budgets.component.scss'
})
export class BudgetsComponent {
  private budgetService = inject(BudgetService);

  budgets = this.budgetService.budgets;
  // Budget being edited.
  editingId = signal<string | null>(null);
  // Unsaved budget limit.
  draftLimit = signal<number>(0);

  // Open the editor with the current limit.
  toggleEdit(id:string){
    this.editingId.set(id);
    this.draftLimit.set(this.budgets().find(b => b.id === id)?.limit ?? 0);
  }
  // Read the draft limit from the input.
  protected onDraftInput($event: Event) {
    this.draftLimit.set(Number(($event.target as HTMLInputElement).value));
  }
  // Save the limit and close the editor.
  saveLimit(id:string){
    this.budgetService.updateLimit(id, this.draftLimit());
    this.editingId.set(null);
  }


  protected statusClass(b: Budget) {
    switch (true) {
      case b.spent > b.limit:
        return 'over';
      case b.spent >= b.limit * 0.70:
        return 'near';
      default:
        return 'ok';
    }
  }

  protected statusLabel(b: any) {
    return "";
  }

  protected progressPct(b: any) {
  return b.spent * 100/b.limit
  }
}
