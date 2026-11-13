import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, signInTarget } from '../../services/auth.service';
import { AuthCardComponent } from '../../UI/auth-card/auth-card.component';
import { apiErrorCode, apiErrorMessage } from '../../utils/http-error';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AuthCardComponent],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  readonly showPassword = signal(false);
  readonly busy = signal(false);
  readonly error = signal('');

  form = new FormGroup({
    username: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3)] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(6)] })
  });

  toggleShowPassword() {
    this.showPassword.update(v => !v);
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { username, password } = this.form.getRawValue();
    this.busy.set(true);
    this.error.set('');
    this.authService.login(username.trim(), password).subscribe({
      next: outcome => this.router.navigate(signInTarget(outcome)),
      error: err => {
        this.busy.set(false);
        if (apiErrorCode(err) === 'EMAIL_NOT_VERIFIED') {
          this.router.navigate(['/verify-email'], { queryParams: { email: err.error.email } });
          return;
        }
        this.error.set(apiErrorMessage(err, 'Could not sign in. Please try again.'));
      }
    });
  }
}
