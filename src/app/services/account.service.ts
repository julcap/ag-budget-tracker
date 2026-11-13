import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export interface TotpSetup {
  secret: string;
  otpauthUri: string;
  qrCodeDataUrl: string;
}

const API = `${environment.apiUrl}/auth`;

/** Security settings for the signed-in user. */
@Injectable({ providedIn: 'root' })
export class AccountService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  changePassword(currentPassword: string, newPassword: string): Observable<unknown> {
    return this.http.put(`${API}/password`, { currentPassword, newPassword });
  }

  startTotpSetup(): Observable<TotpSetup> {
    return this.http.post<TotpSetup>(`${API}/totp/setup`, {});
  }

  enableTotp(code: string): Observable<unknown> {
    return this.http.post(`${API}/totp/enable`, { code }).pipe(tap(() => this.auth.updateUser({ totp_enabled: true })));
  }

  disableTotp(password: string, code: string): Observable<unknown> {
    return this.http.post(`${API}/totp/disable`, { password, code }).pipe(tap(() => this.auth.updateUser({ totp_enabled: false })));
  }
}
