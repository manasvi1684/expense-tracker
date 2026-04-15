import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Category {
  id: number;
  name: string;
  budget: number;
  keywords: string;
  spent?: number;
}
export interface Transaction {
  id: number;
  amount: number;
  description: string;
  category_id: number;
  date: string;
  category?: Category;
}
export interface Session {
  id: number;
  start_date: string;
  total_budget: number;
  remaining_budget: number;
  is_active: boolean;
}

export interface Insights {
  total_spent: number;
  category_breakdown: Record<string, number>;
  expected_spend: number;
  over_under: number;
  next_week_budget: number;
  messages: string[];
}

@Injectable({ providedIn: 'root' })
export class TrackerService {
  private apiUrl = environment.apiUrl;
  private http = inject(HttpClient);

  // State
  transactions = signal<Transaction[]>([]);
  categories = signal<Category[]>([]);
  session = signal<Session | null>(null);
  insights = signal<Insights | null>(null);

  // Computed state
  totalSpent = computed(() => this.transactions().reduce((acc, t) => acc + t.amount, 0));
  remainingBudget = computed(() => {
    const s = this.session();
    return s ? s.total_budget - this.totalSpent() : 0;
  });

  dailySafeSpend = computed(() => {
    const s = this.session();
    if (!s) return 0;
    const daysRemaining = this.getDaysRemainingInMonth(new Date(s.start_date));
    return daysRemaining > 0 ? this.remainingBudget() / daysRemaining : 0;
  });

  constructor() {
    this.loadInitialData();
  }

  getDaysRemainingInMonth(startDate: Date): number {
    const today = new Date();
    // Assuming a 30-day flexible tracking month
    const diffTime = Math.abs(today.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, 30 - diffDays); // Minimum 1 day to prevent divide by zero
  }

  loadInitialData() {
    this.http.get<Session>(`${this.apiUrl}/session/current`).subscribe({
      next: s => this.session.set(s),
      error: () => { } // Silently ignore 404 when user signs up but hasn't created a session yet
    });
    this.http.get<Category[]>(`${this.apiUrl}/categories`).subscribe({
      next: c => this.categories.set(c),
      error: () => { }
    });
    this.http.get<Transaction[]>(`${this.apiUrl}/transactions`).subscribe({
      next: t => this.transactions.set(t),
      error: () => { }
    });
    this.loadInsights();
  }

  loadInsights() {
    this.http.get<Insights>(`${this.apiUrl}/insights/weekly`).subscribe({
      next: i => this.insights.set(i),
      error: () => { } // Silently ignore if no session exists yet
    });
  }

  logSmartTransaction(query: string, date?: string) {
    return this.http.post<Transaction>(`${this.apiUrl}/transactions/smart`, { query, date }).pipe(
      tap(tx => {
        this.transactions.update(current => [tx, ...current]);
        this.loadInsights(); // Refresh insights on new tx
      })
    );
  }

  logRefund(amount: number, description: string, category_id?: number | null) {
    return this.http.post<Transaction>(`${this.apiUrl}/transactions/refund`, {
      amount, description, category_id
    }).pipe(
      tap(tx => {
        this.transactions.update(current => [tx, ...current]);
        this.loadInsights();
      })
    );
  }

  addCategory(name: string, budget: number, keywords: string) {
    return this.http.post<Category>(`${this.apiUrl}/categories`, { name, budget, keywords }).pipe(
      tap(cat => this.categories.update(current => [...current, cat]))
    );
  }

  updateCategory(id: number, name: string, budget: number, keywords: string) {
    return this.http.put<Category>(`${this.apiUrl}/categories/${id}`, { name, budget, keywords }).pipe(
      tap(updated => this.categories.update(cats => cats.map(c => c.id === id ? updated : c)))
    );
  }

  deleteCategory(id: number) {
    return this.http.delete(`${this.apiUrl}/categories/${id}`).pipe(
      tap(() => this.categories.update(cats => cats.filter(c => c.id !== id)))
    );
  }

  deleteTransaction(id: number) {
    return this.http.delete(`${this.apiUrl}/transactions/${id}`).pipe(
      tap(() => {
        this.transactions.update(txs => txs.filter(t => t.id !== id));
        this.loadInsights();
      })
    );
  }

  updateSession(total_budget: number) {
    return this.http.patch<Session>(`${this.apiUrl}/session/current`, { total_budget }).pipe(
      tap(s => this.session.set(s))
    );
  }

  /** Adds `amount` on top of the current total_budget (income / refund top-up). */
  addIncome(amount: number) {
    const current = this.session()?.total_budget ?? 0;
    return this.updateSession(current + amount);
  }

  startNewSession(total_budget: number, start_date: string, already_spent: number) {
    return this.http.post<Session>(`${this.apiUrl}/sessions/new`, { total_budget, start_date, already_spent }).pipe(
      tap(session => {
        this.session.set(session);
        this.transactions.set([]); // clear out transactions on new session
        this.loadInsights();
      })
    );
  }
}
