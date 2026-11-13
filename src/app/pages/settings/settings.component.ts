import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ThemeService } from '../../services/theme.service';
import { SettingsService, ThresholdKey } from '../../services/settings.service';
import { CategoryService } from '../../services/category.service';
import { UNCATEGORIZED } from '../../models/category';
import { apiErrorMessage } from '../../utils/http-error';
import { TransactionType } from '../../models/transaction';
import { CURRENCIES, CurrencyCode, currencySymbol } from '../../utils/money';
import { AuthService } from '../../services/auth.service';
import { ChangePasswordComponent } from '../../components/change-password/change-password.component';
import { TwoFactorSettingsComponent } from '../../components/two-factor-settings/two-factor-settings.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule, ChangePasswordComponent, TwoFactorSettingsComponent],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent {
  private themeService = inject(ThemeService);
  readonly settings = inject(SettingsService);
  readonly categories = inject(CategoryService);

  readonly theme = this.themeService.theme;
  readonly user = inject(AuthService).user;
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
    this.categories.add(this.categoryType, this.categoryName).subscribe({
      next: () => (this.categoryName = ''),
      error: err => (this.categoryError = apiErrorMessage(err, 'Could not add the category.'))
    });
  }

  deleteCategory(name: string) {
    if (this.deletingCategory || name === UNCATEGORIZED) return;
    this.deletingCategory = name;
    this.categoryError = '';
    this.categories.remove(this.categoryType, name).subscribe({
      next: () => (this.deletingCategory = null),
      error: err => {
        this.categoryError = apiErrorMessage(err, 'Could not delete the category. Please retry.');
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
