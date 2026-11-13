import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { RegisterComponent } from './register/register.component';
import { VerifyEmailComponent } from './verify-email/verify-email.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { TwoFactorComponent } from './two-factor/two-factor.component';

describe('Signed-out flows', () => {
  let auth: Record<string, jasmine.Spy | ReturnType<typeof signal>>;
  let router: Router;

  function configure(component: unknown, email: string | null = null) {
    auth = {
      registrationEnabled: jasmine.createSpy().and.returnValue(of(true)),
      register: jasmine.createSpy().and.returnValue(of({})),
      verifyEmail: jasmine.createSpy().and.returnValue(of('signed-in')),
      resendVerification: jasmine.createSpy().and.returnValue(of({ message: 'A new verification code has been sent.' })),
      requestPasswordReset: jasmine.createSpy().and.returnValue(of({ message: 'Code sent' })),
      resetPassword: jasmine.createSpy().and.returnValue(of('totp-required')),
      completeTotp: jasmine.createSpy().and.returnValue(of('signed-in')),
      pendingChallenge: signal<string | null>('challenge')
    };
    TestBed.configureTestingModule({
      imports: [component as any],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(email ? { email } : {}) } } }
      ]
    });
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    const fixture = TestBed.createComponent(component as any);
    fixture.detectChanges();
    return fixture;
  }

  describe('RegisterComponent', () => {
    it('requires matching passwords and a valid email', () => {
      const component = configure(RegisterComponent).componentInstance as RegisterComponent;
      component.form.setValue({ username: 'sam', email: 'nope', password: 'password1', confirmPassword: 'different' });
      component.submit();
      expect(auth['register']).not.toHaveBeenCalled();
      expect(component.form.hasError('mismatch')).toBeTrue();
    });

    it('registers and moves on to email verification', () => {
      const component = configure(RegisterComponent).componentInstance as RegisterComponent;
      component.form.setValue({ username: 'sam', email: 'sam@example.com', password: 'password1', confirmPassword: 'password1' });
      component.submit();
      expect(auth['register']).toHaveBeenCalledWith('sam', 'sam@example.com', 'password1');
      expect(router.navigate).toHaveBeenCalledWith(['/verify-email'], { queryParams: { email: 'sam@example.com' } });
    });

    it('explains when registration is closed', () => {
      const fixture = configure(RegisterComponent);
      (fixture.componentInstance as RegisterComponent).enabled.set(false);
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Registration is currently closed');
      expect(fixture.nativeElement.querySelector('form')).toBeNull();
    });
  });

  describe('VerifyEmailComponent', () => {
    it('verifies the code for the email from the link and signs in', () => {
      const component = configure(VerifyEmailComponent, 'sam@example.com').componentInstance as VerifyEmailComponent;
      component.code.setValue('123456');
      component.submit();
      expect(auth['verifyEmail']).toHaveBeenCalledWith('sam@example.com', '123456');
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    });

    it('starts a cooldown after resending, honouring the server\'s wait time on 429', () => {
      const component = configure(VerifyEmailComponent, 'sam@example.com').componentInstance as VerifyEmailComponent;
      component.resend();
      expect(component.cooldown.remaining()).toBe(30);

      (auth['resendVerification'] as jasmine.Spy).and.returnValue(throwError(() => new HttpErrorResponse({
        status: 429, error: { error: 'Please wait before requesting another code', retryAfterSeconds: 12 }
      })));
      component.resend();
      expect(component.cooldown.remaining()).toBe(12);
      expect(component.error()).toContain('Please wait');
    });
  });

  describe('ForgotPasswordComponent', () => {
    it('requests a code, then resets the password and continues to two-factor when required', () => {
      const component = configure(ForgotPasswordComponent).componentInstance as ForgotPasswordComponent;
      component.email.setValue('sam@example.com');
      component.requestCode();
      expect(component.step()).toBe('reset');

      component.resetForm.setValue({ code: '123456', password: 'newpass1', confirmPassword: 'newpass1' });
      component.resetPassword();
      expect(auth['resetPassword']).toHaveBeenCalledWith('sam@example.com', '123456', 'newpass1');
      expect(router.navigate).toHaveBeenCalledWith(['/two-factor']);
    });
  });

  describe('TwoFactorComponent', () => {
    it('completes sign-in with the authenticator code', () => {
      const component = configure(TwoFactorComponent).componentInstance as TwoFactorComponent;
      component.code.setValue('654321');
      component.submit();
      expect(auth['completeTotp']).toHaveBeenCalledWith('654321');
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    });

    it('sends the user back to sign in when there is no pending challenge or it expired', () => {
      const fixture = configure(TwoFactorComponent);
      (auth['pendingChallenge'] as any).set(null);
      (fixture.componentInstance as TwoFactorComponent).ngOnInit();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);

      (auth['completeTotp'] as jasmine.Spy).and.returnValue(throwError(() => new HttpErrorResponse({
        status: 401, error: { code: 'CHALLENGE_EXPIRED' }
      })));
      const component = fixture.componentInstance as TwoFactorComponent;
      component.code.setValue('654321');
      component.submit();
      expect((router.navigate as jasmine.Spy).calls.allArgs()).toEqual([[['/login']], [['/login']]]);
    });
  });
});
