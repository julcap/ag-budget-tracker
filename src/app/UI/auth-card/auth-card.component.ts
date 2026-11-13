import { Component, input } from '@angular/core';

/** Centered branded card shared by the signed-out pages (sign in, register, verify, reset). */
@Component({
  selector: 'app-auth-card',
  standalone: true,
  templateUrl: './auth-card.component.html',
  styleUrl: './auth-card.component.scss'
})
export class AuthCardComponent {
  readonly heading = input.required<string>();
  readonly subheading = input('');
}
