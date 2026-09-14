import { Component, HostListener, input, output } from '@angular/core';

@Component({
  selector: 'app-backdrop',
  standalone: true,
  templateUrl: './backdrop.component.html',
  styleUrl: './backdrop.component.scss'
})
export class BackdropComponent {
  readonly isOpen = input.required<boolean>();
  readonly close = output<void>();

  @HostListener('window:keydown.escape')
  onEscape() {
    if (this.isOpen()) {
      this.close.emit();
    }
  }

  onBackdropClick() {
    this.close.emit();
  }
}
