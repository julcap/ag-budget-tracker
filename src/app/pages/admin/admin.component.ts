import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Observable } from 'rxjs';
import { AdminUsersService } from '../../services/admin-users.service';
import { AuthService } from '../../services/auth.service';
import { BalanceCardComponent } from '../../components/balance-card/balance-card.component';
import { CreateUserFormComponent } from '../../components/create-user-form/create-user-form.component';
import { ManagedUser } from '../../models/user';
import { apiErrorMessage } from '../../utils/http-error';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [DatePipe, BalanceCardComponent, CreateUserFormComponent],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss'
})
export class AdminComponent implements OnInit {
  private adminUsers = inject(AdminUsersService);
  private auth = inject(AuthService);
  readonly currentUserId = computed(() => this.auth.user()?.id);

  readonly users = this.adminUsers.users;
  readonly loading = signal(true);
  readonly error = signal('');
  readonly notice = signal('');
  readonly busyId = signal<number | null>(null);
  readonly confirmingDeleteId = signal<number | null>(null);
  readonly query = signal('');

  readonly stats = computed(() => {
    const users = this.users();
    return {
      total: users.length,
      admins: users.filter(u => u.is_admin).length,
      totp: users.filter(u => u.totp_enabled).length,
      unverified: users.filter(u => !u.is_verified).length
    };
  });

  readonly filteredUsers = computed(() => {
    const q = this.query().trim().toLowerCase();
    return q ? this.users().filter(u => `${u.username} ${u.email ?? ''}`.toLowerCase().includes(q)) : this.users();
  });

  ngOnInit() {
    this.adminUsers.load().subscribe({
      next: () => this.loading.set(false),
      error: err => {
        this.loading.set(false);
        this.error.set(apiErrorMessage(err, 'Could not load users.'));
      }
    });
  }

  onCreated(user: ManagedUser) {
    this.notice.set(`Created ${user.username}.`);
  }

  toggleAdmin(user: ManagedUser) {
    this.act(user, this.adminUsers.setAdmin(user.id, !user.is_admin),
      `${user.username} is ${user.is_admin ? 'no longer' : 'now'} an administrator.`);
  }

  resetTotp(user: ManagedUser) {
    this.act(user, this.adminUsers.resetTotp(user.id), `Two-factor authentication reset for ${user.username}.`);
  }

  remove(user: ManagedUser) {
    if (this.confirmingDeleteId() !== user.id) {
      this.confirmingDeleteId.set(user.id);
      return;
    }
    this.act(user, this.adminUsers.remove(user.id), `Deleted ${user.username}.`);
  }

  setQuery(event: Event) {
    this.query.set((event.target as HTMLInputElement).value);
  }

  private act(user: ManagedUser, request: Observable<unknown>, successMessage: string) {
    this.busyId.set(user.id);
    this.error.set('');
    request.subscribe({
      next: () => {
        this.busyId.set(null);
        this.confirmingDeleteId.set(null);
        this.notice.set(successMessage);
      },
      error: err => {
        this.busyId.set(null);
        this.confirmingDeleteId.set(null);
        this.error.set(apiErrorMessage(err, 'That action failed. Please try again.'));
      }
    });
  }
}
