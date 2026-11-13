import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AccountService, TotpSetup } from '../../services/account.service';
import { AuthService } from '../../services/auth.service';
import { apiErrorMessage } from '../../utils/http-error';

const SIX_DIGITS = /^\d{6}$/;

@Component({
  selector: 'app-two-factor-settings',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './two-factor-settings.component.html',
  styleUrl: './two-factor-settings.component.scss'
})
export class TwoFactorSettingsComponent {
  private account = inject(AccountService);
  private auth = inject(AuthService);
  readonly enabled = computed(() => this.auth.user()?.totp_enabled ?? false);

  readonly mode = signal<'idle' | 'setup' | 'disable'>('idle');
  readonly setup = signal<TotpSetup | null>(null);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly notice = signal('');

  code = new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(SIX_DIGITS)] });
  disableForm = new FormGroup({
    password: new FormControl('', { nonNullable: true, validators: Validators.required }),
    code: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(SIX_DIGITS)] })
  });

  startSetup() {
    this.reset();
    this.busy.set(true);
    this.account.startTotpSetup().subscribe({
      next: setup => {
        this.busy.set(false);
        this.setup.set(setup);
        this.mode.set('setup');
      },
      error: err => this.fail(err, 'Could not start two-factor setup.')
    });
  }

  confirmSetup() {
    if (this.code.invalid) {
      this.code.markAsTouched();
      return;
    }
    this.busy.set(true);
    this.error.set('');
    this.account.enableTotp(this.code.value).subscribe({
      next: () => this.done('Two-factor authentication is on. You\'ll be asked for a code when you sign in.'),
      error: err => this.fail(err, 'Could not verify that code.')
    });
  }

  startDisable() {
    this.reset();
    this.mode.set('disable');
  }

  confirmDisable() {
    if (this.disableForm.invalid) {
      this.disableForm.markAllAsTouched();
      return;
    }
    const { password, code } = this.disableForm.getRawValue();
    this.busy.set(true);
    this.error.set('');
    this.account.disableTotp(password, code).subscribe({
      next: () => this.done('Two-factor authentication is off.'),
      error: err => this.fail(err, 'Could not turn off two-factor authentication.')
    });
  }

  cancel() {
    this.reset();
  }

  private done(message: string) {
    this.reset();
    this.notice.set(message);
  }

  private fail(error: unknown, fallback: string) {
    this.busy.set(false);
    this.error.set(apiErrorMessage(error, fallback));
  }

  private reset() {
    this.mode.set('idle');
    this.setup.set(null);
    this.busy.set(false);
    this.error.set('');
    this.notice.set('');
    this.code.reset();
    this.disableForm.reset();
  }
}
