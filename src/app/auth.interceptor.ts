import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './services/auth.service';
import { environment } from '../environments/environment';

const APP_NAME = 'budget-tracker';

/**
 * Attaches the session token to API calls and signs out when the server says the session is
 * no longer valid. Other 401s (e.g. a wrong current password) are left to the caller.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) return next(req);
  const auth = inject(AuthService);
  const token = auth.token();
  // X-App-Name identifies this frontend in the shared backend's audit log.
  const headers: Record<string, string> = { 'X-App-Name': APP_NAME };
  if (!token) return next(req.clone({ setHeaders: headers }));

  return next(req.clone({ setHeaders: { ...headers, Authorization: `Bearer ${token}` } })).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && error.error?.code === 'UNAUTHENTICATED') auth.logout();
      return throwError(() => error);
    })
  );
};
