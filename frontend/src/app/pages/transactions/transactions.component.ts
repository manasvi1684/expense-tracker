import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TrackerService, Transaction } from '../../services/tracker.service';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex flex-col gap-8">
      <header class="flex justify-between items-start">
        <div>
          <h1 class="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-white to-primary-200 bg-clip-text text-transparent">My Expenses</h1>
          <p class="text-gray-400 text-sm mt-1">All your daily logs. Tap the bin to remove an entry.</p>
        </div>
        <button (click)="exportToExcel()" [disabled]="exporting() || !tracker.transactions().length"
          class="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex-shrink-0">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
          <span *ngIf="!exporting()">Export Excel</span>
          <span *ngIf="exporting()" class="animate-pulse">Exporting...</span>
        </button>
      </header>

      <!-- Empty state -->
      <div *ngIf="grouped().length === 0" class="text-center p-16 border border-dashed border-white/10 rounded-2xl bg-white/5">
        <svg class="w-14 h-14 text-gray-700 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
        <p class="text-gray-400 font-medium text-lg">No expenses yet.</p>
        <p class="text-gray-600 text-sm mt-1">Go to the Dashboard and log your first entry.</p>
      </div>

      <!-- Grouped by day -->
      <div class="flex flex-col gap-10">
        <div *ngFor="let group of grouped(); trackBy: trackGroup" class="relative pl-6 md:pl-8 border-l border-white/10">
          <div class="absolute -left-2 top-0 w-4 h-4 bg-dark-900 border-2 border-primary-500 rounded-full"></div>
          
          <div class="flex items-center justify-between mb-4 -mt-1">
            <h4 class="text-sm font-bold text-gray-400 uppercase tracking-wider">{{ group.dateLabel }}</h4>
            <span class="text-sm font-semibold"
              [class.text-red-400]="group.total > 0"
              [class.text-green-400]="group.total <= 0">
              {{ group.total > 0 ? '-' : '+' }}₹{{ (group.total | number:'1.0-0')?.replace('-','') }}
            </span>
          </div>

          <div class="flex flex-col gap-2">
            <ng-container *ngFor="let tx of group.transactions; trackBy: trackTx">

              <!-- ── Transaction row ── -->
              <div class="rounded-xl border transition-colors"
                [class]="tx.amount < 0
                  ? 'glass p-4 border-green-500/20 bg-green-500/5'
                  : 'glass p-4 border-white/5 hover:bg-white/5'">

                <div class="flex items-center justify-between">
                  <!-- Left: icon + info -->
                  <div class="flex items-center gap-4">
                    <div class="w-11 h-11 rounded-xl border flex items-center justify-center font-bold text-base flex-shrink-0"
                      [class]="tx.amount < 0
                        ? 'bg-gradient-to-br from-green-500/20 to-dark-800 border-green-500/20 text-green-300'
                        : 'bg-gradient-to-br from-primary-500/20 to-dark-800 border-white/10 text-primary-300'">
                      {{ (tx.category?.name?.charAt(0) || '?') | uppercase }}
                    </div>
                    <div>
                      <div class="flex items-center gap-2">
                        <p class="font-semibold text-white capitalize">{{ tx.category?.name || 'Uncategorized' }}</p>
                        <span *ngIf="tx.amount < 0"
                          class="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-green-500/20 text-green-400 border border-green-500/30">
                          ↩ Refund
                        </span>
                      </div>
                      <p class="text-sm text-gray-400 truncate max-w-[180px] md:max-w-sm">{{ tx.description }}</p>
                      <p class="text-xs text-gray-600 mt-0.5">{{ tx.date | date:'shortTime' }}</p>
                    </div>
                  </div>

                  <!-- Right: amount + actions -->
                  <div class="flex items-center gap-3 flex-shrink-0">
                    <p class="font-bold text-lg"
                      [class.text-red-400]="tx.amount > 0"
                      [class.text-green-400]="tx.amount < 0">
                      {{ tx.amount < 0 ? '+' : '-' }}₹{{ tx.amount < 0 ? (-tx.amount | number:'1.0-2') : (tx.amount | number:'1.0-2') }}
                    </p>

                    <!-- Refund button (only on expense rows) -->
                    <button *ngIf="tx.amount > 0 && refundTargetId() !== tx.id"
                      (click)="openRefund(tx)"
                      class="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-green-400 hover:bg-green-500/10 transition-all"
                      title="Log a refund for this expense">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/>
                      </svg>
                    </button>

                    <!-- Delete (confirm) -->
                    <ng-container *ngIf="confirmId() !== tx.id; else confirmTpl">
                      <button (click)="askConfirm(tx.id)"
                        class="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        title="Delete">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                      </button>
                    </ng-container>
                    <ng-template #confirmTpl>
                      <div class="flex items-center gap-1">
                        <button (click)="confirmDelete(tx)" class="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/40 border border-red-500/30">Delete</button>
                        <button (click)="confirmId.set(null)" class="text-xs px-2 py-1 bg-white/5 text-gray-400 rounded-lg hover:bg-white/10 border border-white/10">Cancel</button>
                      </div>
                    </ng-template>
                  </div>
                </div>

                <!-- ── Inline refund form ── -->
                <div *ngIf="refundTargetId() === tx.id"
                  class="mt-4 pt-4 border-t border-green-500/20">
                  <p class="text-xs font-semibold text-green-400 uppercase tracking-wider mb-3">Log Refund / Return</p>
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label class="block text-xs text-gray-400 mb-1">Refund Amount (₹)</label>
                      <input type="number" [(ngModel)]="refundAmount" name="refundAmount"
                        class="w-full bg-dark-900/60 border border-green-500/30 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-green-400 transition-colors">
                    </div>
                    <div>
                      <label class="block text-xs text-gray-400 mb-1">Note (optional)</label>
                      <input type="text" [(ngModel)]="refundNote" name="refundNote" placeholder="e.g. Returned item"
                        class="w-full bg-dark-900/60 border border-green-500/30 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-green-400 transition-colors">
                    </div>
                  </div>
                  <div class="flex gap-2 mt-3">
                    <button (click)="submitRefund(tx)" [disabled]="!refundAmount || savingRefund()"
                      class="flex-1 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50">
                      <span *ngIf="!savingRefund()">↩ Confirm Refund of ₹{{ refundAmount | number:'1.0-0' }}</span>
                      <span *ngIf="savingRefund()" class="animate-pulse">Saving...</span>
                    </button>
                    <button (click)="closeRefund()"
                      class="px-4 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white text-sm transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>

              </div>
            </ng-container>
          </div>
        </div>
      </div>
    </div>
  `
})
export class TransactionsComponent {
  tracker = inject(TrackerService);
  confirmId = signal<number | null>(null);
  exporting = signal(false);

  // Refund state
  refundTargetId = signal<number | null>(null);
  refundAmount: number | null = null;
  refundNote = '';
  savingRefund = signal(false);

  openRefund(tx: Transaction) {
    this.refundTargetId.set(tx.id);
    this.refundAmount = tx.amount;   // pre-fill with full amount
    this.refundNote = `Refund: ${tx.description}`;
    this.confirmId.set(null);        // close any open delete confirm
  }

  closeRefund() {
    this.refundTargetId.set(null);
    this.refundAmount = null;
    this.refundNote = '';
  }

  submitRefund(tx: Transaction) {
    if (!this.refundAmount) return;
    this.savingRefund.set(true);
    this.tracker.logRefund(
      this.refundAmount,
      this.refundNote || `Refund: ${tx.description}`,
      tx.category_id
    ).subscribe({
      next: () => { this.savingRefund.set(false); this.closeRefund(); },
      error: () => this.savingRefund.set(false)
    });
  }

  grouped = computed(() => {
    const txs = this.tracker.transactions();
    if (!txs.length) return [];

    // Use a stable ISO date string (YYYY-MM-DD) as the map key so groups
    // survive re-renders correctly — the display label is kept separately.
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
      const todayIso = isoDay(today.toISOString());
      const yestIso = isoDay(yesterday.toISOString());
      if (iso === todayIso) return 'Today';
      if (iso === yestIso) return 'Yesterday';
      return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
    };

    const map = new Map<string, Transaction[]>();
    txs.forEach(tx => {
      const key = isoDay(tx.date);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(tx);
    });

    // Map preserves insertion order (already desc from API)
    return Array.from(map.entries()).map(([iso, transactions]) => ({
      isoKey: iso,
      dateLabel: formatLabel(iso),
      transactions,
      total: transactions.reduce((sum, t) => sum + t.amount, 0)
    }));
  });

  // trackBy functions prevent Angular from destroying/recreating DOM nodes
  trackGroup(_: number, group: { isoKey: string }) { return group.isoKey; }
  trackTx(_: number, tx: Transaction) { return tx.id; }

  askConfirm(id: number) { this.confirmId.set(id); }

  confirmDelete(tx: Transaction) {
    this.confirmId.set(null);
    this.tracker.deleteTransaction(tx.id).subscribe();
  }

  exportToExcel() {
    this.exporting.set(true);

    const txs = this.tracker.transactions();
    const cats = this.tracker.categories();
    const catMap = new Map(cats.map(c => [c.id, c]));

    // ── Sheet 1: Expenses ─────────────────────────────────────
    const expenseRows = txs.map(tx => ({
      Date: new Date(tx.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      Time: new Date(tx.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      Category: tx.category?.name ? tx.category.name.charAt(0).toUpperCase() + tx.category.name.slice(1) : 'Uncategorized',
      Description: tx.description,
      'Amount (₹)': tx.amount,
    }));

    // Totals row
    const totalSpent = txs.reduce((s, t) => s + t.amount, 0);
    expenseRows.push({ Date: '', Time: '', Category: 'TOTAL', Description: '', 'Amount (₹)': totalSpent } as any);

    const wsExpenses = XLSX.utils.json_to_sheet(expenseRows);
    wsExpenses['!cols'] = [{ wch: 14 }, { wch: 10 }, { wch: 16 }, { wch: 36 }, { wch: 13 }];

    // ── Sheet 2: Summary ──────────────────────────────────────
    const breakdown: Record<string, number> = {};
    txs.forEach(tx => {
      const name = tx.category?.name ?? 'Uncategorized';
      breakdown[name] = (breakdown[name] ?? 0) + tx.amount;
    });

    const summaryRows = Object.entries(breakdown).map(([cat, spent]) => {
      const catObj = cats.find(c => c.name === cat);
      const budget = catObj?.budget ?? 0;
      const pct = budget > 0 ? ((spent / budget) * 100).toFixed(1) + '%' : 'No budget';
      return {
        Category: cat.charAt(0).toUpperCase() + cat.slice(1),
        'Total Spent (₹)': spent,
        'Monthly Budget (₹)': budget || '—',
        '% of Budget': pct,
        Status: budget > 0 ? (spent > budget ? '🔴 Over budget' : spent / budget > 0.8 ? '🟡 Near limit' : '🟢 On track') : '—',
      };
    });

    summaryRows.push({
      Category: 'GRAND TOTAL',
      'Total Spent (₹)': totalSpent,
      'Monthly Budget (₹)': cats.reduce((s, c) => s + (c.budget ?? 0), 0),
      '% of Budget': '',
      Status: '',
    } as any);

    const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
    wsSummary['!cols'] = [{ wch: 18 }, { wch: 18 }, { wch: 20 }, { wch: 14 }, { wch: 16 }];

    // ── Workbook ──────────────────────────────────────────────
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsExpenses, 'Expenses');
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

    const today = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `expenses_${today}.xlsx`);

    this.exporting.set(false);
  }
}
