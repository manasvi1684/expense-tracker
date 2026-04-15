import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SmartLoggerComponent } from '../../components/smart-logger/smart-logger.component';
import { InsightsComponent } from '../../components/insights/insights.component';
import { TrackerService } from '../../services/tracker.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, SmartLoggerComponent, InsightsComponent],
  template: `
    <div class="flex flex-col gap-8 md:gap-10">
      <!-- Header -->
      <header class="flex justify-between items-center mb-2">
        <div>
          <h1 class="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-white to-primary-200 bg-clip-text text-transparent">Overview</h1>
          <p class="text-gray-400 text-sm md:text-base mt-1">Focusing on your financial targets.</p>
        </div>
      </header>

      <!-- Balance Cards -->
      <div class="grid grid-cols-2 gap-4 md:gap-6">
        <div class="glass-card p-6 relative overflow-hidden group hover:scale-[1.02] transition-transform shadow-primary-500/10">
          <div class="absolute -right-4 -top-4 w-32 h-32 bg-primary-500/30 rounded-full blur-3xl group-hover:bg-primary-400/40 transition-all pointer-events-none"></div>
          <p class="text-primary-300 text-xs md:text-sm uppercase tracking-wider font-semibold mb-2">Remaining</p>
          <h2 class="text-3xl md:text-5xl font-bold text-white">₹{{ tracker.remainingBudget() | number:'1.0-0' }}</h2>
        </div>
        
        <div class="glass-card p-6 relative overflow-hidden group hover:scale-[1.02] transition-transform shadow-blue-500/10">
          <div class="absolute -left-4 -bottom-4 w-32 h-32 bg-blue-500/30 rounded-full blur-3xl group-hover:bg-blue-400/40 transition-all pointer-events-none"></div>
          <p class="text-blue-300 text-xs md:text-sm uppercase tracking-wider font-semibold mb-2">Safe entry/day</p>
          <h2 class="text-3xl md:text-5xl font-bold text-white">₹{{ tracker.dailySafeSpend() | number:'1.0-0' }}</h2>
        </div>
      </div>

      <!-- Smart Logger Vector -->
      <div class="w-full">
         <app-smart-logger></app-smart-logger>
      </div>
      
      <!-- Assistant Insights -->
      <app-insights></app-insights>

      <!-- Recent Transactions grouped by day -->
      <div class="mt-4">
        <div class="flex justify-between items-center mb-6">
            <h3 class="text-xl font-bold text-white tracking-tight">Timeline</h3>
            <button class="text-sm font-medium text-primary-400 hover:text-primary-300 transition-colors">See all</button>
        </div>
        
        <div *ngIf="groupedTransactions().length === 0" class="text-center p-12 border border-dashed border-white/10 rounded-2xl bg-white/5">
            <svg class="w-12 h-12 text-gray-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
            <p class="text-gray-400 font-medium">No entries yet. Start tracking above.</p>
        </div>

      <div class="flex flex-col gap-8">
           <div *ngFor="let group of groupedTransactions(); trackBy: trackGroup" class="relative pl-6 md:pl-8 border-l border-white/10">
              <!-- Day Header -->
              <div class="absolute -left-2 top-0 w-4 h-4 bg-dark-900 border-2 border-primary-500 rounded-full"></div>
              <h4 class="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 -mt-1">{{ group.dateLabel }}</h4>
              
              <!-- Day Transactions -->
              <div class="flex flex-col gap-3">
                 <div *ngFor="let tx of group.transactions; trackBy: trackTx" 
                      class="glass p-4 rounded-xl flex items-center justify-between group/card hover:bg-white/10 transition-colors border border-white/5 shadow-sm">
                   <div class="flex items-center gap-4">
                       <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-dark-800 to-dark-700 border border-white/10 flex items-center justify-center text-primary-400 font-bold text-lg group-hover/card:scale-110 shadow-inner transition-transform">
                         {{ tx.category?.name?.charAt(0) || '?' | uppercase }}
                       </div>
                       <div>
                         <p class="font-semibold text-white md:text-lg capitalize">{{ tx.category?.name || 'Uncategorized' }}</p>
                         <p class="text-sm text-gray-400 truncate max-w-[150px] md:max-w-xs">{{ tx.description }}</p>
                       </div>
                   </div>
                   <div class="flex items-center gap-3">
                     <div class="text-right">
                         <p class="font-bold text-red-400 md:text-lg">-₹{{ tx.amount }}</p>
                         <p class="text-xs text-gray-500 font-medium mt-1">{{ tx.date | date:'shortTime' }}</p>
                     </div>
                     <!-- Delete with confirm -->
                     <ng-container *ngIf="confirmId() !== tx.id; else dashConfirmTpl">
                       <button (click)="askConfirm(tx.id)"
                         class="w-8 h-8 rounded-lg flex items-center justify-center text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all flex-shrink-0"
                         title="Delete">
                         <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                         </svg>
                       </button>
                     </ng-container>
                     <ng-template #dashConfirmTpl>
                       <div class="flex items-center gap-1">
                         <button (click)="confirmDelete(tx.id)" class="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/40 transition-colors border border-red-500/30">Delete</button>
                         <button (click)="confirmId.set(null)" class="text-xs px-2 py-1 bg-white/5 text-gray-400 rounded-lg hover:bg-white/10 transition-colors border border-white/10">Cancel</button>
                       </div>
                     </ng-template>
                   </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent {
  tracker = inject(TrackerService);
  confirmId = signal<number | null>(null);

  groupedTransactions = computed(() => {
    const txs = this.tracker.transactions() || [];

    const isoDay = (dateStr: string) => {
      const d = new Date(dateStr);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const formatLabel = (iso: string) => {
      const [y, m, day] = iso.split('-').map(Number);
      const d = new Date(y, m - 1, day);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      if (iso === isoDay(today.toISOString())) return 'Today';
      if (iso === isoDay(yesterday.toISOString())) return 'Yesterday';
      return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    };

    const map = new Map<string, typeof txs>();
    txs.forEach(tx => {
      const key = isoDay(tx.date);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(tx);
    });

    return Array.from(map.entries()).map(([iso, transactions]) => ({
      isoKey: iso,
      dateLabel: formatLabel(iso),
      transactions
    }));
  });

  trackGroup(_: number, group: { isoKey: string }) { return group.isoKey; }
  trackTx(_: number, tx: { id: number }) { return tx.id; }

  askConfirm(id: number) { this.confirmId.set(id); }

  confirmDelete(id: number) {
    this.confirmId.set(null);
    this.tracker.deleteTransaction(id).subscribe();
  }
}
