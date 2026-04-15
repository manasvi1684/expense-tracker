import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TrackerService } from '../../services/tracker.service';

@Component({
  selector: 'app-setup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex flex-col gap-6 max-w-2xl">
      <header class="mb-2">
        <h1 class="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-primary-200 bg-clip-text text-transparent">Settings</h1>
        <p class="text-gray-400 text-sm mt-1">Manage your tracking period and financial limits.</p>
      </header>

      <!-- ── CURRENT SESSION CARD ────────────────────────── -->
      <div *ngIf="tracker.session() && !startFreshMode()" class="flex flex-col gap-5">

        <!-- Summary -->
        <div class="glass-card p-6">
          <div class="flex items-center justify-between mb-5">
            <h3 class="font-semibold text-white text-base flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block"></span>
              Active Tracking Period
            </h3>
            <span class="text-xs font-medium text-gray-500 bg-white/5 px-3 py-1 rounded-full border border-white/10">
              Started {{ tracker.session()!.start_date | date:'dd MMM yyyy' }}
            </span>
          </div>

          <div class="grid grid-cols-3 gap-4 text-center mb-6">
            <div class="bg-white/5 rounded-xl p-4 border border-white/5">
              <p class="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Budget</p>
              <p class="text-2xl font-bold text-white">₹{{ tracker.session()!.total_budget | number:'1.0-0' }}</p>
            </div>
            <div class="bg-white/5 rounded-xl p-4 border border-white/5">
              <p class="text-xs text-gray-500 uppercase tracking-wider mb-1">Spent</p>
              <p class="text-2xl font-bold text-red-400">₹{{ tracker.totalSpent() | number:'1.0-0' }}</p>
            </div>
            <div class="bg-white/5 rounded-xl p-4 border border-white/5">
              <p class="text-xs text-gray-500 uppercase tracking-wider mb-1">Remaining</p>
              <p class="text-2xl font-bold text-primary-400">₹{{ tracker.remainingBudget() | number:'1.0-0' }}</p>
            </div>
          </div>

          <!-- Edit budget inline -->
          <div class="border-t border-white/5 pt-5">
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Adjust Total Budget</p>
            <div class="flex gap-3">
              <input type="number" [(ngModel)]="editBudget" name="editBudget"
                [placeholder]="tracker.session()!.total_budget"
                class="flex-1 bg-dark-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500">
              <button (click)="saveEdit()" [disabled]="!editBudget || saving()"
                class="bg-primary-600 hover:bg-primary-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors disabled:opacity-50">
                <span *ngIf="!saving()">Update</span>
                <span *ngIf="saving()" class="animate-pulse">Saving...</span>
              </button>
            </div>
            <p *ngIf="editSuccess()" class="text-xs text-primary-400 mt-2">✓ Budget updated successfully.</p>
          </div>
        </div>

        <!-- Add Income Card -->
        <div class="glass-card p-6">
          <div class="flex items-center gap-3 mb-5">
            <div class="w-9 h-9 rounded-xl bg-green-500/20 border border-green-500/30 flex items-center justify-center">
              <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
            </div>
            <div>
              <h3 class="font-semibold text-white text-base">Received Money?</h3>
              <p class="text-xs text-gray-400 mt-0.5">Got a salary, refund, gift or any income? Add it to your budget.</p>
            </div>
          </div>

          <div class="flex flex-col gap-3">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Amount (₹)</label>
                <input type="number" [(ngModel)]="incomeAmount" name="incomeAmount" placeholder="e.g. 5000"
                  class="w-full bg-dark-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-colors">
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Label (optional)</label>
                <input type="text" [(ngModel)]="incomeNote" name="incomeNote" placeholder="e.g. Salary, Refund, Gift"
                  class="w-full bg-dark-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-colors">
              </div>
            </div>

            <!-- Preview -->
            <div *ngIf="incomeAmount" class="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 text-sm flex justify-between items-center">
              <span class="text-gray-400">New remaining budget will be</span>
              <span class="text-green-400 font-bold text-lg">₹{{ (tracker.remainingBudget() + (incomeAmount || 0)) | number:'1.0-0' }}</span>
            </div>

            <button (click)="addIncome()" [disabled]="!incomeAmount || addingIncome()"
              class="w-full bg-green-600 hover:bg-green-500 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              <svg *ngIf="!addingIncome()" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
              <span *ngIf="!addingIncome()">Add ₹{{ incomeAmount | number:'1.0-0' }} to Budget</span>
              <span *ngIf="addingIncome()" class="animate-pulse">Adding...</span>
            </button>

            <p *ngIf="incomeSuccess()" class="text-xs text-green-400 flex items-center gap-1">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
              Budget updated! Your available balance has increased.
            </p>
          </div>
        </div>

        <!-- Start Fresh button -->
        <button (click)="startFreshMode.set(true)"
          class="w-full glass-card p-4 text-center text-gray-400 hover:text-white border border-dashed border-white/10 hover:border-primary-500/40 rounded-xl transition-all text-sm font-medium group">
          <span class="group-hover:text-primary-300">↻ Start a New Month / Fresh Period</span>
        </button>
      </div>

      <!-- ── NEW SESSION FORM ──────────────────────────── -->
      <div *ngIf="!tracker.session() || startFreshMode()" class="flex flex-col gap-5">

        <div *ngIf="startFreshMode()" class="flex items-center gap-3">
          <button (click)="startFreshMode.set(false)" class="text-gray-500 hover:text-white transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
          </button>
          <h3 class="text-white font-semibold text-base">Start Fresh Period</h3>
        </div>

        <div class="glass-card overflow-hidden">
          <div class="p-5 border-b border-white/5 bg-gradient-to-r from-primary-500/10 to-transparent">
             <h3 class="font-semibold text-white text-base">Configure Your Monthly Budget</h3>
             <p class="text-xs text-gray-400 mt-1">
               Formula: <span class="text-primary-300 font-medium">Budget = Bank Balance − Savings − Already Spent</span>
             </p>
          </div>

          <form (ngSubmit)="startSession()" class="p-5 flex flex-col gap-5">
             <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
               <div>
                 <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Current Bank Balance (₹)</label>
                 <input type="number" [(ngModel)]="bankBalance" name="bankBalance" placeholder="e.g. 45000"
                   class="w-full bg-dark-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500">
               </div>
               <div>
                 <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Monthly Savings Goal (₹)</label>
                 <input type="number" [(ngModel)]="aimedSavings" name="aimedSavings" placeholder="e.g. 10000"
                   class="w-full bg-dark-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500">
               </div>
               <div>
                 <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Already Spent This Month (₹)</label>
                 <input type="number" [(ngModel)]="alreadySpent" name="spent" placeholder="e.g. 5000"
                   class="w-full bg-dark-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500">
               </div>
               <div>
                 <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Tracking Start Date</label>
                 <input type="date" [(ngModel)]="startDate" name="startDate"
                   class="w-full bg-dark-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500"
                   style="color-scheme: dark;">
               </div>
             </div>

             <!-- Preview calculation -->
             <div *ngIf="bankBalance" class="bg-primary-500/10 border border-primary-500/20 rounded-xl p-4 text-sm">
               <p class="text-gray-400 mb-1">Calculated tracking budget:</p>
               <p class="text-2xl font-bold text-primary-300">
                 ₹{{ calculateBudget() | number:'1.0-0' }}
               </p>
               <p class="text-xs text-gray-500 mt-1">
                 ₹{{ bankBalance }} − ₹{{ aimedSavings || 0 }} savings − ₹{{ alreadySpent || 0 }} spent
               </p>
             </div>

             <button type="submit" [disabled]="loading() || !bankBalance"
               class="w-full bg-primary-600 hover:bg-primary-500 text-white font-semibold py-3 px-4 rounded-xl transition-colors shadow-lg shadow-primary-500/20 disabled:opacity-50">
               <span *ngIf="!loading()">{{ startFreshMode() ? 'Start Fresh Period' : 'Initialize Tracking' }}</span>
               <span *ngIf="loading()" class="animate-pulse">Setting up...</span>
             </button>
          </form>
        </div>
      </div>

    </div>
  `
})
export class SetupComponent {
  tracker = inject(TrackerService);
  router = inject(Router);

  // New session form
  bankBalance: number | null = null;
  aimedSavings: number | null = null;
  startDate = new Date().toISOString().split('T')[0];
  alreadySpent: number | null = null;

  // Edit existing session
  editBudget: number | null = null;

  // Add income
  incomeAmount: number | null = null;
  incomeNote = '';

  loading = signal(false);
  saving = signal(false);
  editSuccess = signal(false);
  startFreshMode = signal(false);
  addingIncome = signal(false);
  incomeSuccess = signal(false);

  calculateBudget(): number {
    return Math.max(0,
      (Number(this.bankBalance) || 0) -
      (Number(this.aimedSavings) || 0) -
      (Number(this.alreadySpent) || 0)
    );
  }

  saveEdit() {
    if (!this.editBudget) return;
    this.saving.set(true);
    this.tracker.updateSession(Number(this.editBudget)).subscribe({
      next: () => {
        this.saving.set(false);
        this.editSuccess.set(true);
        this.editBudget = null;
        setTimeout(() => this.editSuccess.set(false), 3000);
      },
      error: () => this.saving.set(false)
    });
  }

  addIncome() {
    if (!this.incomeAmount) return;
    this.addingIncome.set(true);
    this.tracker.addIncome(Number(this.incomeAmount)).subscribe({
      next: () => {
        this.addingIncome.set(false);
        this.incomeSuccess.set(true);
        this.incomeAmount = null;
        this.incomeNote = '';
        setTimeout(() => this.incomeSuccess.set(false), 4000);
      },
      error: () => this.addingIncome.set(false)
    });
  }

  startSession() {
    if (!this.bankBalance) return;
    this.loading.set(true);
    const trackingBudget = this.calculateBudget();

    this.tracker.startNewSession(trackingBudget, this.startDate, 0).subscribe({
      next: () => {
        this.loading.set(false);
        this.startFreshMode.set(false);
        this.tracker.loadInitialData();
        this.router.navigate(['/dashboard']);
      },
      error: () => this.loading.set(false)
    });
  }
}
