import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  return inject(AuthService).ensureUser().pipe(map(user => user ? true : router.createUrlTree(['/login'])));
};

export const adminGuard: CanActivateFn = () => {
  const router = inject(Router);
  return inject(AuthService).ensureUser().pipe(
    map(user => {
      if (!user) return router.createUrlTree(['/login']);
      return user.is_admin ? true : router.createUrlTree(['/dashboard']);
    })
  );
};

/** For sign-in/registration pages: someone already signed in goes straight to the app. */
export const guestGuard: CanActivateFn = () => {
  const router = inject(Router);
  return inject(AuthService).ensureUser().pipe(map(user => user ? router.createUrlTree(['/dashboard']) : true));
};
