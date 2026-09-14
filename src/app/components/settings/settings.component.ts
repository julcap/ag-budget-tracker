import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ThemeService } from '../../services/theme.service';
import { AuthService } from '../../services/auth.service';
import { SettingsService } from '../../services/settings.service';
import { CategoryService, UNCATEGORIZED } from '../../services/category.service';
import { TransactionService } from '../../services/transaction.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent {
  private themeService = inject(ThemeService);
  private authService = inject(AuthService);
  private settingsService = inject(SettingsService);
  private router = inject(Router);

  categories = inject(CategoryService);
  private transactions = inject(TransactionService);
  categoryType: 'expense' | 'income' = 'expense';
  categoryName = '';
  categoryError = '';
  deletingCategory: string | null = null;
  readonly uncategorized = UNCATEGORIZED;

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

  theme = this.themeService.theme;

  userName = 'Jordan Avery';
  userEmail = 'jordan@example.com';
  selectedCurrency = 'USD';

  spendingWarningPercent = this.settingsService.spendingWarningPercent;
  spendingWarningIconPercent = this.settingsService.spendingWarningIconPercent;
  spendingDangerPercent = this.settingsService.spendingDangerPercent;

  setWarningPercent(val: number | string) {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (!isNaN(num)) {
      this.settingsService.setSpendingWarningPercent(num);
    }
  }

  setWarningIconPercent(val: number | string) {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (!isNaN(num)) {
      this.settingsService.setSpendingWarningIconPercent(num);
    }
  }

  setDangerPercent(val: number | string) {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (!isNaN(num)) {
      this.settingsService.setSpendingDangerPercent(num);
    }
  }

  toggleTheme() {
    this.themeService.toggle();
  }

  deleteAccount() {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      this.authService.logout();
      this.router.navigate(['/login']);
    }
  }
}
