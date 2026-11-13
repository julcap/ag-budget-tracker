import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ThemeService } from '../../services/theme.service';
import { SettingsService, ThresholdKey } from '../../services/settings.service';
import { CategoryService, UNCATEGORIZED } from '../../services/category.service';
import { TransactionService } from '../../services/transaction.service';
import { TransactionType } from '../../models/transaction';
import { CURRENCIES, CurrencyCode, currencySymbol } from '../../utils/money';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent {
  private themeService = inject(ThemeService);
  private transactions = inject(TransactionService);
  readonly settings = inject(SettingsService);
  readonly categories = inject(CategoryService);

  readonly theme = this.themeService.theme;
  readonly uncategorized = UNCATEGORIZED;
  readonly currencies = CURRENCIES.map(code => ({ code, label: `${code} (${currencySymbol(code)})` }));
  readonly thresholds: { key: ThresholdKey; label: string; hint: string }[] = [
    { key: 'spendingWarningPercent', label: 'Warning (orange text)', hint: 'Spent % of monthly income that turns the spent amount orange' },
    { key: 'spendingWarningIconPercent', label: 'Alert (warning icon)', hint: 'Spent % of monthly income that shows the warning icon' },
    { key: 'spendingDangerPercent', label: 'Danger (red text)', hint: 'Spent % of monthly income that turns the spent amount red' }
  ];

  categoryType: TransactionType = 'expense';
  categoryName = '';
  categoryError = '';
  deletingCategory: string | null = null;

  addCategory() {
    this.categoryError = '';
    try {
      if (this.categories.add(this.categoryType, this.categoryName)) this.categoryName = '';
      else this.categoryError = 'Enter a unique category name.';
    } catch { this.categoryError = 'Unable to save categories in this browser.'; }
  }

  deleteCategory(name: string) {
    if (this.deletingCategory || name === UNCATEGORIZED) return;
    const type = this.categoryType;
    this.deletingCategory = name;
    this.categoryError = '';
    this.transactions.reassignCategory(type, name).subscribe({
      next: () => {
        try { this.categories.remove(type, name); }
        catch { this.categoryError = 'Transactions were moved, but the category could not be removed. Please retry.'; }
        this.deletingCategory = null;
      },
      error: () => {
        this.categoryError = 'Could not move all transactions. The category was kept; please retry.';
        this.deletingCategory = null;
      }
    });
  }

  setCurrency(currency: CurrencyCode) {
    this.settings.update({ currency });
  }

  setThreshold(key: ThresholdKey, value: number | string) {
    this.settings.setThreshold(key, Number(value));
  }

  toggleTheme() {
    this.themeService.toggle();
  }
}
