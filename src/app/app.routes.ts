import {Routes} from '@angular/router';
import {DashboardComponent} from "./pages/dashboard/dashboard.component";
import {TransactionsComponent} from "./pages/transactions/transactions.component";
import {LoginComponent} from "./pages/login/login.component";
import {authGuard} from './guards/auth.guard';
import {BudgetsComponent} from "./components/budgets/budgets.component";
import {SettingsComponent} from "./components/settings/settings.component";
import {TransactionFormComponent} from "./components/transaction-form/transaction-form.component";

export const routes: Routes = [
  {path: '', redirectTo: 'dashboard', pathMatch: 'full'},
  {path: 'login', component: LoginComponent},
  {path: 'dashboard', component: DashboardComponent, canActivate: [authGuard]},
  {path: 'transactions', component: TransactionsComponent, canActivate: [authGuard]},
  { path: 'budgets', component: BudgetsComponent, canActivate: [authGuard] },
  { path: 'settings', component: SettingsComponent, canActivate: [authGuard] },
  { path: 'transactions/:id/edit', component: TransactionFormComponent, canActivate: [authGuard] },
];
