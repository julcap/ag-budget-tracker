import { Component, inject, OnInit, signal } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AuthCardComponent } from '../../UI/auth-card/auth-card.component';
import { apiErrorMessage } from '../../utils/http-error';

export function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  return group.get('password')?.value === group.get('confirmPassword')?.value ? null : { mismatch: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AuthCardComponent],
  templateUrl: './register.component.html'
})
export class RegisterComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  readonly enabled = signal<boolean | null>(null);
  readonly busy = signal(false);
  readonly error = signal('');

  form = new FormGroup({
    username: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3)] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(6)] }),
    confirmPassword: new FormControl('', { nonNullable: true, validators: Validators.required })
  }, { validators: passwordsMatch });

  ngOnInit() {
    this.authService.registrationEnabled().subscribe({
      next: enabled => this.enabled.set(enabled),
      error: () => this.enabled.set(true)
    });
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { username, email, password } = this.form.getRawValue();
    this.busy.set(true);
    this.error.set('');
    this.authService.register(username.trim(), email.trim(), password).subscribe({
      next: () => this.router.navigate(['/verify-email'], { queryParams: { email: email.trim() } }),
      error: err => {
        this.busy.set(false);
        this.error.set(apiErrorMessage(err, 'Could not create your account. Please try again.'));
      }
    });
  }
}
