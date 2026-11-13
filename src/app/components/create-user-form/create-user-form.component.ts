import { Component, inject, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminUsersService } from '../../services/admin-users.service';
import { ManagedUser } from '../../models/user';
import { apiErrorMessage } from '../../utils/http-error';

@Component({
  selector: 'app-create-user-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './create-user-form.component.html',
  styleUrl: './create-user-form.component.scss'
})
export class CreateUserFormComponent {
  private adminUsers = inject(AdminUsersService);

  readonly created = output<ManagedUser>();
  readonly busy = signal(false);
  readonly error = signal('');

  form = new FormGroup({
    username: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3)] }),
    email: new FormControl('', { nonNullable: true, validators: Validators.email }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(6)] }),
    is_admin: new FormControl(false, { nonNullable: true })
  });

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.busy.set(true);
    this.error.set('');
    this.adminUsers.create({ ...value, username: value.username.trim(), email: value.email.trim() }).subscribe({
      next: user => {
        this.busy.set(false);
        this.form.reset();
        this.created.emit(user);
      },
      error: err => {
        this.busy.set(false);
        this.error.set(apiErrorMessage(err, 'Could not create the user.'));
      }
    });
  }
}
