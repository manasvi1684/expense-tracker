import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CashTransaction {
  id: number;
  amount: number;
  description: string;
  date: string;
}

export interface CashWallet {
  opening_balance: number;
  current_balance: number;
  transactions: CashTransaction[];
}

@Injectable({
  providedIn: 'root'
})
export class CashService {
  private apiUrl = environment.apiUrl + '/cash';

  wallet = signal<CashWallet | null>(null);
  loading = signal(false);

  constructor(private http: HttpClient) { }

  loadWallet() {
    this.loading.set(true);
    return this.http.get<CashWallet>(`${this.apiUrl}/wallet`).pipe(
      tap(data => {
        this.wallet.set(data);
        this.loading.set(false);
      }),
      catchError(err => {
        if (err.status === 404) {
          // Wallet not set up yet
          this.wallet.set(null);
        }
        this.loading.set(false);
        return of(null);
      })
    );
  }

  setupWallet(opening_balance: number) {
    return this.http.post(`${this.apiUrl}/wallet/setup`, { opening_balance }).pipe(
      tap(() => this.loadWallet().subscribe())
    );
  }

  addCash(amount: number, description: string) {
    return this.http.post<CashTransaction>(`${this.apiUrl}/add`, { amount, description }).pipe(
      tap(() => this.loadWallet().subscribe())
    );
  }

  spendCash(amount: number, description: string) {
    return this.http.post<CashTransaction>(`${this.apiUrl}/spend`, { amount, description }).pipe(
      tap(() => this.loadWallet().subscribe())
    );
  }

  deleteTransaction(id: number) {
    return this.http.delete(`${this.apiUrl}/transactions/${id}`).pipe(
      tap(() => this.loadWallet().subscribe())
    );
  }
}
