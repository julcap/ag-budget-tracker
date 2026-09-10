import {Routes} from '@angular/router';
import {DashboardComponent} from "./pages/dashboard/dashboard.component";
import {TransactionsComponent} from "./pages/transactions/transactions.component";
import {LoginComponent} from "./pages/login/login.component";

export const routes: Routes = [
  {path: '', redirectTo: 'dashboard', pathMatch: 'full'},
  {path: 'login', component: LoginComponent},
  {path: 'dashboard', component: DashboardComponent},
  {path: 'transactions', component: TransactionsComponent}
];
