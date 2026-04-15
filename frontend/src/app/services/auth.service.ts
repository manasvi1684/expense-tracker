import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = environment.apiUrl + '/auth';
  private http = inject(HttpClient);
  public router = inject(Router);

  token = signal<string | null>(localStorage.getItem('token'));
  isAuthenticated = signal<boolean>(!!localStorage.getItem('token'));

  login(username: string, password: string) {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    return this.http.post<{ access_token: string }>(`${this.apiUrl}/login`, formData).pipe(
      tap(res => {
        localStorage.setItem('token', res.access_token);
        this.token.set(res.access_token);
        this.isAuthenticated.set(true);
      })
    );
  }

  signup(username: string, password: string) {
    return this.http.post<{ access_token: string }>(`${this.apiUrl}/signup`, { username, password }).pipe(
      tap(res => {
        localStorage.setItem('token', res.access_token);
        this.token.set(res.access_token);
        this.isAuthenticated.set(true);
      })
    );
  }

  logout() {
    localStorage.removeItem('token');
    this.token.set(null);
    this.isAuthenticated.set(false);
    this.router.navigate(['/auth']);
  }
}
