import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { User } from '../models/user';
import { CategoryLists } from '../models/category';
import { Settings } from '../services/settings.service';

export const TEST_USER: User = { id: 1, username: 'tester', email: 'tester@example.com', is_admin: false, totp_enabled: false };

export const TEST_CATEGORIES: CategoryLists = {
  expense: ['Groceries', 'Rent', 'Transport', 'Entertainment', 'Utilities', 'Other', 'Uncategorized'],
  income: ['Salary', 'Freelance', 'Investments', 'Gift', 'Other', 'Uncategorized']
};

export const TEST_SETTINGS: Settings = {
  currency: 'USD', theme: 'light', spendingWarningPercent: 50, spendingWarningIconPercent: 75, spendingDangerPercent: 100
};

/** Signs in through the real AuthService (needs provideHttpClientTesting) and lets session effects run. */
export function signIn(user: User = TEST_USER) {
  const http = TestBed.inject(HttpTestingController);
  TestBed.inject(AuthService).login(user.username, 'password1').subscribe();
  http.expectOne('/api/auth/login').flush({ token: 'test-token', user });
  TestBed.flushEffects();
}

/** Answers whichever per-user store loads are pending, with the given (or default) data. */
export function flushStoreLoads(data: {
  transactions?: object[]; budgets?: object[]; categories?: CategoryLists; settings?: Partial<Settings>;
} = {}) {
  const http = TestBed.inject(HttpTestingController);
  const respond = (url: string, body: object) => http.match(url).forEach(req => req.flush(body));
  respond('/api/budget-tracker/transactions', data.transactions ?? []);
  respond('/api/budget-tracker/budgets', data.budgets ?? []);
  respond('/api/budget-tracker/categories', data.categories ?? TEST_CATEGORIES);
  respond('/api/budget-tracker/settings', { ...TEST_SETTINGS, ...data.settings });
}

/** Signs out without a real navigation (test modules usually register no /login route). */
export function signOut() {
  const router = TestBed.inject(Router);
  if (!jasmine.isSpy(router.navigate)) spyOn(router, 'navigate').and.resolveTo(true);
  TestBed.inject(AuthService).logout();
  TestBed.inject(HttpTestingController).match('/api/auth/logout').forEach(req => req.flush(null));
  TestBed.flushEffects();
}
