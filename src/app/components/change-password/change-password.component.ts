import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AccountService } from '../../services/account.service';
import { apiErrorMessage } from '../../utils/http-error';
import { passwordsMatch } from '../../pages/register/register.component';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './change-password.component.html'
})
export class ChangePasswordComponent {
  private account = inject(AccountService);

  readonly open = signal(false);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly saved = signal(false);

  form = new FormGroup({
    currentPassword: new FormControl('', { nonNullable: true, validators: Validators.required }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(6)] }),
    confirmPassword: new FormControl('', { nonNullable: true, validators: Validators.required })
  }, { validators: passwordsMatch });

  toggle() {
    this.open.update(v => !v);
    this.form.reset();
    this.error.set('');
    this.saved.set(false);
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { currentPassword, password } = this.form.getRawValue();
    this.busy.set(true);
    this.error.set('');
    this.account.changePassword(currentPassword, password).subscribe({
      next: () => {
        this.busy.set(false);
        this.open.set(false);
        this.saved.set(true);
      },
      error: err => {
        this.busy.set(false);
        this.error.set(apiErrorMessage(err, 'Could not change your password.'));
      }
    });
  }
}
