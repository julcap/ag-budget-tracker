import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService, signInTarget } from '../../services/auth.service';
import { AuthCardComponent } from '../../UI/auth-card/auth-card.component';
import { apiErrorCode, apiErrorMessage } from '../../utils/http-error';
import { createCooldown } from '../../utils/cooldown';

const RESEND_COOLDOWN_SECONDS = 30;

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AuthCardComponent],
  templateUrl: './verify-email.component.html'
})
export class VerifyEmailComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  readonly email = inject(ActivatedRoute).snapshot.queryParamMap.get('email') ?? '';
  readonly busy = signal(false);
  readonly error = signal('');
  readonly notice = signal('');
  readonly cooldown = createCooldown();

  code = new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^\d{6}$/)] });

  submit() {
    if (this.code.invalid) {
      this.code.markAsTouched();
      return;
    }
    this.busy.set(true);
    this.error.set('');
    this.authService.verifyEmail(this.email, this.code.value).subscribe({
      next: outcome => this.router.navigate(signInTarget(outcome)),
      error: err => {
        this.busy.set(false);
        this.error.set(apiErrorMessage(err, 'Could not verify the code. Please try again.'));
        if (apiErrorCode(err) === 'MAX_ATTEMPTS_REACHED') this.code.reset();
      }
    });
  }

  resend() {
    this.error.set('');
    this.notice.set('');
    this.authService.resendVerification(this.email).subscribe({
      next: response => {
        this.notice.set(response.message);
        this.cooldown.start(RESEND_COOLDOWN_SECONDS);
      },
      error: err => {
        this.error.set(apiErrorMessage(err, 'Could not send a new code.'));
        const wait = err?.error?.retryAfterSeconds;
        if (typeof wait === 'number') this.cooldown.start(wait);
      }
    });
  }
}
