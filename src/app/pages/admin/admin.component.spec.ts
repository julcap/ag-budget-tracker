import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { AdminComponent } from './admin.component';
import { AuthService } from '../../services/auth.service';
import { ManagedUser } from '../../models/user';

const users: ManagedUser[] = [
  { id: 1, username: 'Admin', email: null, is_admin: true, is_verified: true, totp_enabled: false, created_at: '2026-11-01T00:00:00Z' },
  { id: 2, username: 'sam', email: 'sam@example.com', is_admin: false, is_verified: true, totp_enabled: true, created_at: '2026-11-02T00:00:00Z' },
  { id: 3, username: 'pat', email: 'pat@example.com', is_admin: false, is_verified: false, totp_enabled: false, created_at: '2026-11-03T00:00:00Z' }
];

describe('AdminComponent', () => {
  let fixture: ComponentFixture<AdminComponent>;
  let component: AdminComponent;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { user: signal(users[0]) } }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(AdminComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    http.expectOne('/api/admin/users').flush({ users });
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  const row = (name: string) =>
    [...fixture.nativeElement.querySelectorAll('.user-row')].find((r: HTMLElement) => r.textContent?.includes(name)) as HTMLElement;

  it('summarises the platform', () => {
    expect(component.stats()).toEqual({ total: 3, admins: 1, totp: 1, unverified: 1 });
  });

  it('prevents admins from demoting or deleting themselves', () => {
    const own = row('(you)');
    own.querySelectorAll('button').forEach(button => expect(button.disabled).toBeTrue());
  });

  it('creates a user and adds it to the list', () => {
    const form = fixture.debugElement.query(el => el.name === 'app-create-user-form').componentInstance;
    form.form.setValue({ username: 'newbie', email: '', password: 'secret1', is_admin: false });
    form.submit();
    const req = http.expectOne(r => r.method === 'POST' && r.url === '/api/admin/users');
    expect(req.request.body).toEqual({ username: 'newbie', email: null, password: 'secret1', is_admin: false });
    req.flush({ ...users[2], id: 4, username: 'newbie', is_verified: true });

    expect(component.users().map(u => u.username)).toContain('newbie');
    expect(component.notice()).toBe('Created newbie.');
  });

  it('resets two-factor authentication for a user who lost their device', () => {
    component.resetTotp(users[1]);
    const req = http.expectOne('/api/admin/users/2/totp');
    expect(req.request.method).toBe('DELETE');
    req.flush({});
    expect(component.users().find(u => u.id === 2)?.totp_enabled).toBeFalse();
  });

  it('asks for confirmation before deleting', () => {
    component.remove(users[2]);
    http.expectNone('/api/admin/users/3');
    component.remove(users[2]);
    http.expectOne('/api/admin/users/3').flush({});
    expect(component.users().some(u => u.id === 3)).toBeFalse();
  });

  it('shows the API error when an action is refused', () => {
    component.toggleAdmin(users[2]);
    http.expectOne('/api/admin/users/3').flush(
      { error: 'Cannot make an unverified user an admin — verify their email first' },
      { status: 400, statusText: 'Bad Request' }
    );
    expect(component.error()).toContain('Cannot make an unverified user an admin');
  });

  it('filters users by search text', () => {
    component.query.set('PAT@');
    expect(component.filteredUsers().map(u => u.username)).toEqual(['pat']);
  });
});
