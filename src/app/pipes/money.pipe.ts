import { inject, Pipe, PipeTransform } from '@angular/core';
import { SettingsService } from '../services/settings.service';
import { formatMoney } from '../utils/money';

// Impure so the output follows the currency selected in Settings.
@Pipe({ name: 'money', standalone: true, pure: false })
export class MoneyPipe implements PipeTransform {
  private settings = inject(SettingsService);

  transform(amount: number, display: 'plain' | 'signed' = 'plain'): string {
    return formatMoney(amount, this.settings.currency(), display === 'signed');
  }
}
