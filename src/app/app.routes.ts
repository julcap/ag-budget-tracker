import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { TransactionsComponent } from './pages/transactions/transactions.component';
import { LoginComponent } from './pages/login/login.component';
import { BudgetsComponent } from './pages/budgets/budgets.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'login', component: LoginComponent, title: 'Sign in · Ledger' },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard], title: 'Dashboard · Ledger' },
  { path: 'transactions', component: TransactionsComponent, canActivate: [authGuard], title: 'Transactions · Ledger' },
  { path: 'budgets', component: BudgetsComponent, canActivate: [authGuard], title: 'Budgets · Ledger' },
  { path: 'settings', component: SettingsComponent, canActivate: [authGuard], title: 'Settings · Ledger' },
  { path: '**', redirectTo: 'dashboard' }
];
