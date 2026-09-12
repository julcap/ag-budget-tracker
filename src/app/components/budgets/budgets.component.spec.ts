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
      providers: [provideHttpClient(), provideHttpClientTesting()]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BudgetsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders budgets when the API response arrives after initial rendering', () => {
    expect(fixture.nativeElement.querySelectorAll('.budget-card').length).toBe(0);

    const http = TestBed.inject(HttpTestingController);
    http.expectOne(`${environment.apiUrl}/budgets`).flush([
      { id: 'a', name: 'Rent', spent: 980, limit: 1000 }
    ]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.budget-card').length).toBe(1);
    expect(fixture.nativeElement.querySelector('.budget-name').textContent).toContain('Rent');
    http.verify();
  });
});
