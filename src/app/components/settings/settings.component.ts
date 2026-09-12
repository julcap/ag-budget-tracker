import {Component, inject} from '@angular/core';
import {ThemeService} from "../../services/theme.service";

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent {
  themeService = inject(ThemeService);
  theme = this.themeService.theme

  toggleTheme(){
    this.themeService.toggle()
  }
}
