import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, signInTarget } from '../../services/auth.service';
import { AuthCardComponent } from '../../UI/auth-card/auth-card.component';
import { apiErrorCode, apiErrorMessage } from '../../utils/http-error';

@Component({
  selector: 'app-two-factor',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AuthCardComponent],
  templateUrl: './two-factor.component.html'
})
export class TwoFactorComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  readonly busy = signal(false);
  readonly error = signal('');

  code = new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^\d{6}$/)] });

  ngOnInit() {
    // The challenge only lives in memory; after a reload the user must sign in again.
    if (!this.authService.pendingChallenge()) this.router.navigate(['/login']);
  }

  submit() {
    if (this.code.invalid) {
      this.code.markAsTouched();
      return;
    }
    this.busy.set(true);
    this.error.set('');
    this.authService.completeTotp(this.code.value).subscribe({
      next: outcome => this.router.navigate(signInTarget(outcome)),
      error: err => {
        this.busy.set(false);
        this.code.reset();
        if (apiErrorCode(err) === 'CHALLENGE_EXPIRED') {
          this.router.navigate(['/login']);
          return;
        }
        this.error.set(apiErrorMessage(err, 'Could not verify the code.'));
      }
    });
  }
}
