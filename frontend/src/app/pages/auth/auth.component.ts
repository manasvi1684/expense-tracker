import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-dark-900 px-4">
      <div class="max-w-md w-full glass-card p-8 relative overflow-hidden">
        <div class="absolute -right-10 -top-10 w-40 h-40 bg-primary-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -left-10 -bottom-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
        
        <div class="text-center mb-8 relative z-10">
           <h1 class="text-3xl font-bold tracking-tight text-white focus">Focus</h1>
           <p class="text-gray-400 text-sm mt-1">Intelligent Expense Tracking</p>
        </div>

        <form (ngSubmit)="onSubmit()" class="flex flex-col gap-5 relative z-10">
           <div>
              <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Username</label>
              <input type="text" [(ngModel)]="username" name="username" class="w-full bg-dark-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500 shadow-inner" required>
           </div>
           
           <div>
              <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Password</label>
              <input type="password" [(ngModel)]="password" name="password" class="w-full bg-dark-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500 shadow-inner" required>
           </div>
           
           <p *ngIf="errorMessage()" class="text-red-400 text-sm text-center font-medium">{{ errorMessage() }}</p>

           <button type="submit" [disabled]="loading()" class="mt-2 w-full bg-primary-600 hover:bg-primary-500 text-white font-semibold py-3 px-4 rounded-xl transition-colors shadow-lg shadow-primary-500/20 disabled:opacity-50">
              <span *ngIf="!loading()">{{ isLoginMode() ? 'Login' : 'Create Account' }}</span>
              <span *ngIf="loading()" class="animate-pulse">Processing...</span>
           </button>
        </form>

        <div class="mt-6 text-center relative z-10">
           <button type="button" (click)="toggleMode()" class="text-sm text-primary-400 hover:text-primary-300">
              {{ isLoginMode() ? "Don't have an account? Sign up." : "Already have an account? Log in." }}
           </button>
        </div>
      </div>
    </div>
  `
})
export class AuthComponent {
  authService = inject(AuthService);
  router = inject(Router);

  isLoginMode = signal(true);
  loading = signal(false);
  errorMessage = signal<string | null>(null);

  username = '';
  password = '';

  toggleMode() {
    this.isLoginMode.set(!this.isLoginMode());
    this.errorMessage.set(null);
  }

  onSubmit() {
    if (!this.username || !this.password) return;
    this.loading.set(true);
    this.errorMessage.set(null);

    const request = this.isLoginMode() 
        ? this.authService.login(this.username, this.password) 
        : this.authService.signup(this.username, this.password);

    request.subscribe({
      next: () => {
         this.loading.set(false);
         // Once auth resolves, go to setup (onboarding). The setup screen will decide whether to go to Dashboard.
         this.router.navigate(['/setup']);
      },
      error: (err) => {
         this.loading.set(false);
         if (err.status === 401 || err.status === 400) {
            this.errorMessage.set(err.error.detail || "Authentication failed.");
         } else {
            this.errorMessage.set("An error occurred. Please try again.");
         }
      }
    });
  }
}
