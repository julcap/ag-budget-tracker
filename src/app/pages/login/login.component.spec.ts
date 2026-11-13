import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../../services/auth.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let auth: { login: jasmine.Spy };
  let router: Router;

  beforeEach(async () => {
    auth = { login: jasmine.createSpy('login') };
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: auth }]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture.detectChanges();
  });

  it('does not submit an invalid form', () => {
    component.submit();
    expect(auth.login).not.toHaveBeenCalled();
    expect(component.form.touched).toBeTrue();
  });

  it('goes to the dashboard after signing in', () => {
    auth.login.and.returnValue(of('signed-in'));
    component.form.setValue({ username: ' sam ', password: 'password1' });
    component.submit();
    expect(auth.login).toHaveBeenCalledWith('sam', 'password1');
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('goes to the two-factor step when the account requires it', () => {
    auth.login.and.returnValue(of('totp-required'));
    component.form.setValue({ username: 'sam', password: 'password1' });
    component.submit();
    expect(router.navigate).toHaveBeenCalledWith(['/two-factor']);
  });

  it('sends unverified accounts to email verification', () => {
    auth.login.and.returnValue(throwError(() => new HttpErrorResponse({
      status: 403, error: { error: 'Email not verified', code: 'EMAIL_NOT_VERIFIED', email: 'sam@example.com' }
    })));
    component.form.setValue({ username: 'sam', password: 'password1' });
    component.submit();
    expect(router.navigate).toHaveBeenCalledWith(['/verify-email'], { queryParams: { email: 'sam@example.com' } });
  });

  it('shows the API error for bad credentials', () => {
    auth.login.and.returnValue(throwError(() => new HttpErrorResponse({ status: 401, error: { error: 'Invalid credentials' } })));
    component.form.setValue({ username: 'sam', password: 'password1' });
    component.submit();
    fixture.detectChanges();
    expect(component.error()).toBe('Invalid credentials');
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('Invalid credentials');
    expect(component.busy()).toBeFalse();
  });

  it('toggles password visibility', () => {
    component.toggleShowPassword();
    expect(component.showPassword()).toBeTrue();
  });
});
