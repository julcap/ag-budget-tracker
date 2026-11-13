import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { ThemeService } from './services/theme.service';
import { HeaderComponent } from './components/header/header.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent],
  templateUrl: './app.component.html'
})
export class AppComponent {
  readonly isAuthenticated = inject(AuthService).isAuthenticated;

  constructor() {
    // Instantiated here so the saved theme applies on load, not only after visiting Settings.
    inject(ThemeService);
  }
}
