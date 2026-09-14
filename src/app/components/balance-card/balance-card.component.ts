import { Component, input } from '@angular/core';

@Component({
  selector: 'app-balance-card',
  standalone: true,
  imports: [],
  templateUrl: './balance-card.component.html',
  styleUrl: './balance-card.component.scss'
})
export class BalanceCardComponent {
  label = input.required<string>();
  value = input.required<string>();
  trend = input<'up' | 'down' | null>(null);
  valueColor = input<string | null>(null);
  warning = input<boolean>(false);
}
