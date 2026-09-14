import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideHttpClient(),
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should compute balance and totals', () => {
    expect(component.balance()).toBeTruthy();
    expect(component.incomeThisMonth()).toBeTruthy();
    expect(component.spentThisMonth()).toBeTruthy();
  });

  it('should compute category spending and active category detail', () => {
    const cats = component.categorySpending();
    expect(cats.length).toBeGreaterThan(0);
    expect(component.activeCategoryDetail()).toBe('Click a category to see its share of spending');

    component.toggleCategory(cats[0].name);
    expect(component.activeCategory()).toBe(cats[0].name);
    expect(component.activeCategoryDetail()).toContain(cats[0].name);

    component.toggleCategory(cats[0].name);
    expect(component.activeCategory()).toBeNull();
  });

  it('should toggle selected transaction', () => {
    expect(component.selectedTxId()).toBeNull();
    component.toggleSelectedTx('1');
    expect(component.selectedTxId()).toBe('1');
    component.toggleSelectedTx('1');
    expect(component.selectedTxId()).toBeNull();
  });
});
