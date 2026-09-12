import {inject, Injectable, signal} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Budget} from "../models/budget";
import {environment} from "../../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class BudgetService {
  private http = inject(HttpClient);
  _budgets = signal<Budget[]>([]);
  budgets = this._budgets.asReadonly();

  constructor() {
    this.http.get<Budget[]>(`${environment.apiUrl}/budgets`).subscribe(data => this._budgets.set(data))
  }

  updateLimit(id:string,newLimit:number){
    this._budgets.update(budgets => budgets.map(budget => budget.id === id ? {...budget, limit: newLimit} : budget));

    this.http.patch(`${environment.apiUrl}/budgets`, this._budgets())
  }
}
