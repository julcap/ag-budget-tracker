import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';

const LINKS = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/transactions', label: 'Transactions' },
  { path: '/budgets', label: 'Budgets' },
  { path: '/settings', label: 'Settings' }
];

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  private authService = inject(AuthService);

  readonly links = computed(() =>
    this.authService.isAdmin() ? [...LINKS, { path: '/admin', label: 'Admin' }] : LINKS);
  readonly displayName = computed(() => this.authService.user()?.username ?? '');
  readonly initials = computed(() => {
    const words = this.displayName().split(/[\s._-]+/).filter(Boolean);
    return words.slice(0, 2).map(word => word[0].toUpperCase()).join('');
  });

  logout() {
    this.authService.logout();
  }
}
