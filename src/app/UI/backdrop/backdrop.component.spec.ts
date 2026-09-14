import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BackdropComponent } from './backdrop.component';

describe('BackdropComponent', () => {
  let component: BackdropComponent;
  let fixture: ComponentFixture<BackdropComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BackdropComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(BackdropComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit close on backdrop click', () => {
    spyOn(component.close, 'emit');
    const backdropEl: HTMLElement = fixture.nativeElement.querySelector('.modal-backdrop');
    backdropEl.click();
    expect(component.close.emit).toHaveBeenCalled();
  });

  it('should emit close on Escape key', () => {
    spyOn(component.close, 'emit');
    component.onEscape();
    expect(component.close.emit).toHaveBeenCalled();
  });
});
