// services/theme.service.ts
import { Injectable, signal, effect } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private _theme = signal<'light' | 'dark'>(this.getInitialTheme());
  theme = this._theme.asReadonly();

  constructor() {
    effect(() => {
      document.body.setAttribute('data-theme', this._theme());
      localStorage.setItem('theme', this._theme());
    });
  }

  toggle() {
    this._theme.update(t => (t === 'light' ? 'dark' : 'light'));
  }

  private getInitialTheme(): 'light' | 'dark' {
    return (localStorage.getItem('theme') as 'light' | 'dark') ?? 'light';
  }
}
