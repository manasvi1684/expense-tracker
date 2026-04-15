import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CashService } from '../../services/cash.service';

@Component({
  selector: 'app-cash',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex flex-col gap-8">
      <header>
        <h1 class="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-green-600 bg-clip-text text-transparent">Cash Wallet</h1>
        <p class="text-gray-400 text-sm mt-1">Independent ledger for your physical cash.</p>
      </header>

      <!-- Loading State -->
      <div *ngIf="cashService.loading()" class="flex justify-center p-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>

      <ng-container *ngIf="!cashService.loading()">
        <!-- First Time Setup -->
        <div *ngIf="!cashService.wallet()" class="glass-card p-8 border border-emerald-500/30 text-center">
          <div class="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/40">
            <svg class="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
          </div>
          <h2 class="text-2xl font-bold text-white mb-2">Set Up Cash Wallet</h2>
          <p class="text-gray-400 mb-6 max-w-md mx-auto">How much physical cash do you have on hand right now? This creates your starting balance.</p>
          
          <div class="flex flex-col sm:flex-row gap-3 max-w-sm mx-auto">
            <input type="number" [(ngModel)]="setupAmount" placeholder="Amount (e.g. 500)"
              class="flex-1 bg-dark-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500 focus:outline-none placeholder-gray-600 text-center sm:text-left text-lg">
            <button (click)="submitSetup()" [disabled]="setupAmount === null"
              class="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors disabled:opacity-50">
              Set Balance
            </button>
          </div>
        </div>

        <ng-container *ngIf="cashService.wallet() as wallet">
          <!-- Balance Hero Card -->
          <div class="glass-card p-8 relative overflow-hidden" [ngClass]="wallet.current_balance >= 0 ? 'border-emerald-500/30' : 'border-red-500/30'">
            <div class="absolute top-0 right-0 -mr-8 -mt-8 opacity-10">
              <svg class="w-64 h-64" [class.text-emerald-500]="wallet.current_balance >= 0" [class.text-red-500]="wallet.current_balance < 0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
            </div>
            
            <p class="text-gray-400 font-semibold uppercase tracking-wider text-sm mb-1">Cash Balance</p>
            <h2 class="text-5xl md:text-6xl font-bold tracking-tight mb-2" [class.text-white]="wallet.current_balance >= 0" [class.text-red-400]="wallet.current_balance < 0">
              ₹{{ wallet.current_balance | number:'1.0-0' }}
            </h2>
            <p class="text-gray-500 text-sm">Opening balance was ₹{{ wallet.opening_balance | number:'1.0-0' }}</p>
          </div>

          <!-- Actions -->
          <div class="grid grid-cols-2 gap-4">
            <button (click)="toggleAction('add')" [class.ring-2]="activeAction() === 'add'" class="glass-card p-4 flex flex-col items-center justify-center gap-2 hover:bg-white/5 transition-all text-emerald-400 border border-emerald-500/20 ring-emerald-500">
              <div class="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
              </div>
              <span class="font-semibold text-sm">Add Cash</span>
            </button>

            <button (click)="toggleAction('spend')" [class.ring-2]="activeAction() === 'spend'" class="glass-card p-4 flex flex-col items-center justify-center gap-2 hover:bg-white/5 transition-all text-red-400 border border-red-500/20 ring-red-500">
              <div class="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/></svg>
              </div>
              <span class="font-semibold text-sm">Spend Cash</span>
            </button>
          </div>

          <!-- Action Form -->
          <div *ngIf="activeAction()" class="glass-card p-6 border animate-fadeIn" [ngClass]="activeAction() === 'add' ? 'border-emerald-500/30' : 'border-red-500/30'">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-bold text-white" [class.text-emerald-400]="activeAction() === 'add'" [class.text-red-400]="activeAction() === 'spend'">
                {{ activeAction() === 'add' ? 'Received Cash' : 'Spent Cash' }}
              </h3>
              <button (click)="activeAction.set(null)" class="text-gray-500 hover:text-white">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            
            <div class="flex flex-col sm:flex-row gap-3">
              <input type="number" [(ngModel)]="actionAmount" placeholder="Amount (₹)"
                [ngClass]="activeAction() === 'add' ? 'focus:border-emerald-500' : 'focus:border-red-500'"
                class="w-full sm:w-32 bg-dark-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none placeholder-gray-600" />
                
              <input type="text" [(ngModel)]="actionDesc" placeholder="Description (e.g. Food, Salary)"
                [ngClass]="activeAction() === 'add' ? 'focus:border-emerald-500' : 'focus:border-red-500'"
                class="flex-1 bg-dark-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none placeholder-gray-600" />
                
              <button (click)="submitAction()" [disabled]="!actionAmount || !actionDesc || processing()"
                class="text-white font-semibold px-6 py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center whitespace-nowrap min-w-[120px]"
                [ngClass]="activeAction() === 'add' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500'">
                <span *ngIf="!processing()">Save</span>
                <span *ngIf="processing()" class="animate-pulse">...</span>
              </button>
            </div>
          </div>

          <!-- Timeline -->
          <div class="mt-4">
            <h3 class="text-lg font-bold text-white mb-4">Transaction History</h3>
            
            <div *ngIf="wallet.transactions.length === 0" class="text-center p-10 border border-dashed border-white/10 rounded-2xl bg-white/5">
              <p class="text-gray-400 font-medium">No cash transactions yet.</p>
            </div>

            <div class="flex flex-col gap-3">
              <div *ngFor="let tx of wallet.transactions; trackBy: trackTx" 
                   class="glass p-4 rounded-xl flex items-center justify-between border border-white/5 hover:bg-white/5 transition-colors group">
                <div class="flex items-center gap-4">
                  <div class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0"
                    [class]="tx.amount > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'">
                    {{ tx.amount > 0 ? '+' : '-' }}
                  </div>
                  <div>
                    <p class="font-semibold text-white truncate max-w-[200px] md:max-w-md">{{ tx.description }}</p>
                    <p class="text-xs text-gray-500 mt-0.5">{{ tx.date | date:'mediumDate' }} at {{ tx.date | date:'shortTime' }}</p>
                  </div>
                </div>
                
                <div class="flex items-center gap-4">
                  <p class="font-bold text-lg" [class.text-emerald-400]="tx.amount > 0" [class.text-red-400]="tx.amount < 0">
                    {{ tx.amount > 0 ? '+' : '-' }}₹{{ tx.amount > 0 ? tx.amount : -tx.amount }}
                  </p>
                  
                  <ng-container *ngIf="confirmId() !== tx.id; else confirmTpl">
                    <button (click)="askConfirm(tx.id)" class="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  </ng-container>
                  <ng-template #confirmTpl>
                    <div class="flex items-center gap-1">
                      <button (click)="deleteTx(tx.id)" class="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/40">Del</button>
                      <button (click)="confirmId.set(null)" class="text-xs px-2 py-1 bg-white/5 text-gray-400 rounded-lg">Esc</button>
                    </div>
                  </ng-template>
                </div>
              </div>
            </div>
          </div>
        </ng-container>
      </ng-container>
    </div>
  `
})
export class CashComponent implements OnInit {
  cashService = inject(CashService);

  setupAmount: number | null = null;
  
  activeAction = signal<'add' | 'spend' | null>(null);
  actionAmount: number | null = null;
  actionDesc = '';
  processing = signal(false);

  confirmId = signal<number | null>(null);

  ngOnInit() {
    this.cashService.loadWallet().subscribe();
  }

  submitSetup() {
    if (this.setupAmount !== null) {
      this.cashService.setupWallet(this.setupAmount).subscribe();
    }
  }

  toggleAction(action: 'add' | 'spend') {
    if (this.activeAction() === action) {
      this.activeAction.set(null);
    } else {
      this.activeAction.set(action);
      this.actionAmount = null;
      this.actionDesc = '';
    }
  }

  submitAction() {
    if (!this.actionAmount || !this.actionDesc) return;
    this.processing.set(true);

    const req = this.activeAction() === 'add' 
      ? this.cashService.addCash(this.actionAmount, this.actionDesc)
      : this.cashService.spendCash(this.actionAmount, this.actionDesc);

    req.subscribe({
      next: () => {
        this.processing.set(false);
        this.activeAction.set(null);
      },
      error: () => this.processing.set(false)
    });
  }

  askConfirm(id: number) {
    this.confirmId.set(id);
  }

  deleteTx(id: number) {
    this.confirmId.set(null);
    this.cashService.deleteTransaction(id).subscribe();
  }

  trackTx(_: number, tx: any) { return tx.id; }
}
