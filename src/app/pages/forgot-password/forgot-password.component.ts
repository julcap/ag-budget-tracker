import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, signInTarget } from '../../services/auth.service';
import { AuthCardComponent } from '../../UI/auth-card/auth-card.component';
import { apiErrorMessage } from '../../utils/http-error';
import { createCooldown } from '../../utils/cooldown';
import { passwordsMatch } from '../register/register.component';

const RESEND_COOLDOWN_SECONDS = 30;

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AuthCardComponent],
  templateUrl: './forgot-password.component.html'
})
export class ForgotPasswordComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  readonly step = signal<'request' | 'reset'>('request');
  readonly busy = signal(false);
  readonly error = signal('');
  readonly notice = signal('');
  readonly cooldown = createCooldown();

  email = new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] });
  resetForm = new FormGroup({
    code: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^\d{6}$/)] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(6)] }),
    confirmPassword: new FormControl('', { nonNullable: true, validators: Validators.required })
  }, { validators: passwordsMatch });

  requestCode() {
    if (this.email.invalid) {
      this.email.markAsTouched();
      return;
    }
    this.busy.set(true);
    this.error.set('');
    this.authService.requestPasswordReset(this.email.value.trim()).subscribe({
      next: response => {
        this.busy.set(false);
        this.notice.set(response.message);
        this.step.set('reset');
        this.cooldown.start(RESEND_COOLDOWN_SECONDS);
      },
      error: err => {
        this.busy.set(false);
        this.error.set(apiErrorMessage(err, 'Could not send a reset code.'));
        const wait = err?.error?.retryAfterSeconds;
        if (typeof wait === 'number') this.cooldown.start(wait);
      }
    });
  }

  resetPassword() {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }
    const { code, password } = this.resetForm.getRawValue();
    this.busy.set(true);
    this.error.set('');
    this.authService.resetPassword(this.email.value.trim(), code, password).subscribe({
      next: outcome => this.router.navigate(signInTarget(outcome)),
      error: err => {
        this.busy.set(false);
        this.error.set(apiErrorMessage(err, 'Could not reset your password.'));
      }
    });
  }

  startOver() {
    this.step.set('request');
    this.error.set('');
    this.notice.set('');
    this.resetForm.reset();
  }
}
