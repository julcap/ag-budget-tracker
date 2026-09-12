import {Component, inject} from '@angular/core';
import {Router, RouterLink, RouterLinkActive, RouterOutlet} from "@angular/router";
import {AuthService} from "./services/auth.service";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet,RouterLink,RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})

export class AppComponent {
  title= 'Budget tracker'
  private authService = inject(AuthService)
  private router = inject(Router)

  isAuthenticated = this.authService.isAuthenticated

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
