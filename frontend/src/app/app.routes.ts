import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { CalendarComponent } from './pages/calendar/calendar.component';
import { CategoriesComponent } from './pages/categories/categories.component';
import { SetupComponent } from './pages/setup/setup.component';
import { AuthComponent } from './pages/auth/auth.component';
import { TransactionsComponent } from './pages/transactions/transactions.component';
import { CashComponent } from './pages/cash/cash.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'auth', component: AuthComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'transactions', component: TransactionsComponent, canActivate: [authGuard] },
  { path: 'cash', component: CashComponent, canActivate: [authGuard] },
  { path: 'calendar', component: CalendarComponent, canActivate: [authGuard] },
  { path: 'categories', component: CategoriesComponent, canActivate: [authGuard] },
  { path: 'setup', component: SetupComponent, canActivate: [authGuard] }
];
