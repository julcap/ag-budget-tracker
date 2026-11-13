import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { TransactionsComponent } from './pages/transactions/transactions.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { VerifyEmailComponent } from './pages/verify-email/verify-email.component';
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password.component';
import { TwoFactorComponent } from './pages/two-factor/two-factor.component';
import { BudgetsComponent } from './pages/budgets/budgets.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { AdminComponent } from './pages/admin/admin.component';
import { adminGuard, authGuard, guestGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'login', component: LoginComponent, canActivate: [guestGuard], title: 'Sign in · Ledger' },
  { path: 'register', component: RegisterComponent, canActivate: [guestGuard], title: 'Create account · Ledger' },
  { path: 'verify-email', component: VerifyEmailComponent, canActivate: [guestGuard], title: 'Verify email · Ledger' },
  { path: 'forgot-password', component: ForgotPasswordComponent, canActivate: [guestGuard], title: 'Reset password · Ledger' },
  { path: 'two-factor', component: TwoFactorComponent, canActivate: [guestGuard], title: 'Two-factor authentication · Ledger' },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard], title: 'Dashboard · Ledger' },
  { path: 'transactions', component: TransactionsComponent, canActivate: [authGuard], title: 'Transactions · Ledger' },
  { path: 'budgets', component: BudgetsComponent, canActivate: [authGuard], title: 'Budgets · Ledger' },
  { path: 'settings', component: SettingsComponent, canActivate: [authGuard], title: 'Settings · Ledger' },
  { path: 'admin', component: AdminComponent, canActivate: [adminGuard], title: 'Platform management · Ledger' },
  { path: '**', redirectTo: 'dashboard' }
];
