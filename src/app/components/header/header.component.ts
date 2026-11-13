import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SettingsService } from '../../services/settings.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  private authService = inject(AuthService);
  private settings = inject(SettingsService);
  private router = inject(Router);

  readonly links = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/transactions', label: 'Transactions' },
    { path: '/budgets', label: 'Budgets' },
    { path: '/settings', label: 'Settings' }
  ];

  readonly displayName = computed(() => this.settings.userName().trim() || this.settings.userEmail().trim());
  readonly initials = computed(() => {
    const words = this.displayName().split(/[\s@.]+/).filter(Boolean);
    return words.slice(0, 2).map(word => word[0].toUpperCase()).join('');
  });

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
