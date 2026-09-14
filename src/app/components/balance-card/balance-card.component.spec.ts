import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BalanceCardComponent } from './balance-card.component';

describe('BalanceCardComponent', () => {
  let component: BalanceCardComponent;
  let fixture: ComponentFixture<BalanceCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BalanceCardComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(BalanceCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('label', 'Total Balance');
    fixture.componentRef.setInput('value', '$2,450.00');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render label and value', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.card-label')?.textContent).toContain('Total Balance');
    expect(el.querySelector('.card-value')?.textContent).toContain('$2,450.00');
  });

  it('should render trend icon when trend is up', () => {
    fixture.componentRef.setInput('trend', 'up');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.trend-icon')).toBeTruthy();
    expect(el.querySelector('.card-value')?.classList.contains('color-ok')).toBeTrue();
  });
});
