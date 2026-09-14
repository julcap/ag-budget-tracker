import { provideRouter } from '@angular/router';
import { CategoryService } from '../../services/category.service';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';

import { BudgetsComponent } from './budgets.component';

describe('BudgetsComponent', () => {
  let component: BudgetsComponent;
  let fixture: ComponentFixture<BudgetsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BudgetsComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BudgetsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows unlimited categories without warnings and saves the global editor using the API ID', () => {
    const http = TestBed.inject(HttpTestingController);
    http.expectOne(`${environment.apiUrl}/budgets`).flush([]);
    http.expectOne(`${environment.apiUrl}/transactions`).flush([
      { id: 'expense', type: 'expense', category: 'Rent', date: 'Today', amount: -500 }
    ]);
    fixture.detectChanges();
    const category = [...fixture.nativeElement.querySelectorAll('.budget-card')]
      .find((card: any) => card.getAttribute('aria-label') === 'Rent budget') as HTMLElement;
    expect(category.textContent).toContain('∞');
    expect(category.querySelector('.status-badge')?.textContent).toContain('Unlimited');
    expect(category.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow')).toBe('0');

    const hero: HTMLElement = fixture.nativeElement.querySelector('.budget-hero');
    (hero.querySelector('.icon-btn') as HTMLButtonElement).click();
    fixture.detectChanges();
    const input = hero.querySelector('input') as HTMLInputElement;
    input.value = '2000';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    (hero.querySelector('.btn-primary') as HTMLButtonElement).click();
    const save = http.expectOne(`${environment.apiUrl}/budgets`);
    save.flush({ ...save.request.body, id: 'generated-id' });
    fixture.detectChanges();
    expect(hero.querySelector('.budget-meta')?.textContent).toContain('$2,000.00');
    expect(hero.querySelector('input')).toBeNull();
    expect(hero.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow')).toBe('25');
    http.verify();
  });

  it('renders budgets when the API response arrives after initial rendering', () => {
    expect(fixture.nativeElement.querySelectorAll('.budget-card').length).toBe(8);

    const http = TestBed.inject(HttpTestingController);
    http.expectOne(`${environment.apiUrl}/budgets`).flush([
      { id: 'a', name: 'Rent', spent: 980, limit: 1000 }
    ]);
    http.expectOne(`${environment.apiUrl}/transactions`).flush([]);
    TestBed.inject(CategoryService).add('expense', 'Healthcare');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.budget-card').length).toBe(9);
    expect(fixture.nativeElement.querySelector('.budget-name').textContent).toContain('Total expenses');
    TestBed.inject(CategoryService).remove('expense', 'Healthcare');
    http.verify();
  });
});
