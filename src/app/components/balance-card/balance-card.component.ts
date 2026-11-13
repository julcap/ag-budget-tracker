import { Component, input } from '@angular/core';

export type ValueTone = 'ok' | 'warn' | 'danger';

@Component({
  selector: 'app-balance-card',
  standalone: true,
  templateUrl: './balance-card.component.html',
  styleUrl: './balance-card.component.scss'
})
export class BalanceCardComponent {
  label = input.required<string>();
  value = input.required<string>();
  trend = input<'up' | 'down' | null>(null);
  valueColor = input<ValueTone | null>(null);
  warning = input<boolean>(false);
}
