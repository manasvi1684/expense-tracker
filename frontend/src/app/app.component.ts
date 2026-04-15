import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <main class="min-h-screen bg-dark-900 font-sans text-white relative flex selection:bg-primary-500 selection:text-white">
      
      <!-- Premium Background glow effects -->
      <div class="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary-600/10 blur-[120px] pointer-events-none z-0"></div>
      <div class="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[130px] pointer-events-none z-0"></div>
      
      <!-- Desktop Sidebar Navigation -->
      <aside *ngIf="auth.isAuthenticated()" class="hidden md:flex flex-col w-64 bg-dark-900/50 backdrop-blur-xl border-r border-white/10 z-20 sticky top-0 h-screen p-6">
        <div class="flex items-center gap-2 mb-10">
           <div class="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center font-bold text-white shadow-lg shadow-primary-500/20">F</div>
           <h2 class="text-xl font-bold tracking-tight">Focus</h2>
        </div>
        
        <nav class="flex flex-col gap-2 flex-grow">
           <a routerLink="/dashboard" routerLinkActive="bg-white/10 text-white" [routerLinkActiveOptions]="{exact: true}" class="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
              <span class="font-medium">Dashboard</span>
           </a>

           <a routerLink="/transactions" routerLinkActive="bg-white/10 text-white" class="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
              <span class="font-medium">Expenses</span>
           </a>

           <a routerLink="/cash" routerLinkActive="bg-white/10 text-white" class="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all text-emerald-400">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
              <span class="font-medium">Cash Wallet</span>
           </a>
           
           <a routerLink="/calendar" routerLinkActive="bg-white/10 text-white" class="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              <span class="font-medium">Timeline</span>
           </a>

           <a routerLink="/categories" routerLinkActive="bg-white/10 text-white" class="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
              <span class="font-medium">Budgets</span>
           </a>

           <a routerLink="/setup" routerLinkActive="bg-white/10 text-white" class="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              <span class="font-medium">Settings</span>
           </a>
        </nav>
        
        <div class="mt-auto pt-6 border-t border-white/5">
           <button (click)="logout()" class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all font-medium">
             <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
             Logout
           </button>
        </div>
      </aside>
      
      <!-- Main Content Area -->
      <div class="flex-1 w-full max-w-5xl mx-auto relative z-10 p-4 md:p-8 lg:p-12 pb-24 md:pb-12 h-screen overflow-y-auto" [class.max-w-5xl]="auth.isAuthenticated()">
         <router-outlet></router-outlet>
      </div>

      <!-- Bottom Navigation Bar (Mobile Only) -->
      <nav *ngIf="auth.isAuthenticated()" class="md:hidden fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-safe">
        <div class="w-full bg-dark-900/80 backdrop-blur-xl border-t border-white/10 px-6 py-3 flex justify-between items-center shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
           <a routerLink="/dashboard" routerLinkActive="text-primary-400" [routerLinkActiveOptions]="{exact: true}" class="flex flex-col items-center gap-1 text-gray-500 hover:text-primary-300 transition-colors">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
              <span class="text-[10px] font-medium tracking-wide">Home</span>
           </a>
           
           <a routerLink="/transactions" routerLinkActive="text-primary-400" class="flex flex-col items-center gap-1 text-gray-500 hover:text-primary-300 transition-colors">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
              <span class="text-[10px] font-medium tracking-wide">Expenses</span>
           </a>

           <a routerLink="/cash" routerLinkActive="text-emerald-400" class="flex flex-col items-center gap-1 text-gray-500 hover:text-emerald-300 transition-colors">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
              <span class="text-[10px] font-medium tracking-wide">Cash</span>
           </a>
           
           <a routerLink="/calendar" routerLinkActive="text-primary-400" class="flex flex-col items-center gap-1 text-gray-500 hover:text-primary-300 transition-colors">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              <span class="text-[10px] font-medium tracking-wide">Calendar</span>
           </a>

           <a routerLink="/categories" routerLinkActive="text-primary-400" class="flex flex-col items-center gap-1 text-gray-500 hover:text-primary-300 transition-colors">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
              <span class="text-[10px] font-medium tracking-wide">Budgets</span>
           </a>

           <a routerLink="/setup" routerLinkActive="text-primary-400" class="flex flex-col items-center gap-1 text-gray-500 hover:text-primary-300 transition-colors">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              <span class="text-[10px] font-medium tracking-wide">Settings</span>
           </a>
        </div>
      </nav>
    </main>
  `
})
export class AppComponent {
  auth = inject(AuthService);
  
  logout() {
    this.auth.logout();
  }
}
