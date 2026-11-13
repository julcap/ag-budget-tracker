import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TransactionService } from './transaction.service';
import { environment } from '../../environments/environment';
import { todayIsoDate } from '../utils/date';

describe('TransactionService', () => {
  const API = `${environment.apiUrl}/transactions`;
  let service: TransactionService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(TransactionService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads transactions and exposes the current month', () => {
    http.expectOne(API).flush([
      { id: 'now', type: 'expense', merchant: 'A', category: 'Rent', amount: -1, date: todayIsoDate() },
      { id: 'old', type: 'expense', merchant: 'B', category: 'Rent', amount: -1, date: '2001-01-01' }
    ]);
    expect(service.loaded()).toBeTrue();
    expect(service.transactions().length).toBe(2);
    expect(service.currentMonth().map(t => t.id)).toEqual(['now']);
  });

  it('reports a load failure', () => {
    http.expectOne(API).flush(null, { status: 0, statusText: 'Unknown Error' });
    expect(service.error()).toContain('Unable to load');
  });

  it('adds, updates and removes transactions in the local list after the API confirms', () => {
    http.expectOne(API).flush([]);
    const draft = { type: 'expense' as const, merchant: 'Shop', category: 'Groceries', amount: -5, date: '2026-01-01' };

    service.add(draft).subscribe();
    expect(service.transactions().length).toBe(0);
    http.expectOne(r => r.method === 'POST' && r.url === API).flush({ ...draft, id: 'new' });
    expect(service.transactions().map(t => t.id)).toEqual(['new']);

    service.update('new', { amount: -7 }).subscribe();
    http.expectOne(`${API}/new`).flush({ ...draft, id: 'new', amount: -7 });
    expect(service.transactions()[0].amount).toBe(-7);

    service.remove('new').subscribe();
    const del = http.expectOne(`${API}/new`);
    expect(del.request.method).toBe('DELETE');
    del.flush({});
    expect(service.transactions()).toEqual([]);
  });
});
