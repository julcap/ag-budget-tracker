import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { ManagedUser } from '../models/user';
import { environment } from '../../environments/environment';

export interface NewUser {
  username: string;
  email: string;
  password: string;
  is_admin: boolean;
}

const API = `${environment.apiUrl}/admin/users`;

@Injectable({ providedIn: 'root' })
export class AdminUsersService {
  private http = inject(HttpClient);
  private _users = signal<ManagedUser[]>([]);

  readonly users = this._users.asReadonly();

  load(): Observable<{ users: ManagedUser[] }> {
    return this.http.get<{ users: ManagedUser[] }>(API).pipe(tap(r => this._users.set(r.users)));
  }

  create(user: NewUser): Observable<ManagedUser> {
    return this.http.post<ManagedUser>(API, { ...user, email: user.email || null }).pipe(
      tap(created => this._users.update(list => [created, ...list]))
    );
  }

  setAdmin(id: number, isAdmin: boolean): Observable<unknown> {
    return this.http.put(`${API}/${id}`, { is_admin: isAdmin }).pipe(tap(() => this.patch(id, { is_admin: isAdmin })));
  }

  resetTotp(id: number): Observable<unknown> {
    return this.http.delete(`${API}/${id}/totp`).pipe(tap(() => this.patch(id, { totp_enabled: false })));
  }

  resetPassword(id: number, password: string): Observable<unknown> {
    return this.http.put(`${API}/${id}/password`, { password });
  }

  remove(id: number): Observable<unknown> {
    return this.http.delete(`${API}/${id}`).pipe(tap(() => this._users.update(list => list.filter(u => u.id !== id))));
  }

  private patch(id: number, changes: Partial<ManagedUser>) {
    this._users.update(list => list.map(u => (u.id === id ? { ...u, ...changes } : u)));
  }
}
