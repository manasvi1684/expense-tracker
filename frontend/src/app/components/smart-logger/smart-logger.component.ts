import { Component, inject, signal, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TrackerService } from '../../services/tracker.service';

@Component({
  selector: 'app-smart-logger',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="glass-card p-6 w-full transition-all duration-300 relative overflow-hidden" [class.ring-2]="isFocused()" [class.ring-primary-500]="isFocused()">
      <div class="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent pointer-events-none"></div>

      <div class="flex justify-between items-center mb-4 relative z-10">
        <h3 class="text-base font-semibold text-white">Log Expense</h3>
        <!-- Date toggle -->
        <button type="button" (click)="showDatePicker.set(!showDatePicker())"
          class="text-xs text-gray-400 hover:text-primary-300 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 hover:border-primary-500/30 transition-all">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
          {{ showDatePicker() ? selectedDateLabel() : 'Log for past day?' }}
        </button>
      </div>

      <!-- Date picker row -->
      <div *ngIf="showDatePicker()" class="mb-4 relative z-10">
        <input type="date" [(ngModel)]="selectedDate" name="selectedDate"
          class="w-full bg-dark-900/50 border border-primary-500/30 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary-500 text-sm"
          style="color-scheme: dark;">
        <p class="text-xs text-gray-600 mt-1">You can log for any date — even April 1st.</p>
      </div>

      <form (ngSubmit)="onSubmit()" class="relative z-10">
        <div class="relative">
          <input
            #loggerInput
            type="text"
            [(ngModel)]="query"
            name="query"
            placeholder="e.g., 120 lunch  or  500 uber"
            class="w-full bg-dark-900/50 border border-white/10 rounded-xl px-5 py-4 pr-24 text-white placeholder-gray-500 focus:outline-none text-lg shadow-inner"
            autocomplete="off"
            (focus)="isFocused.set(true)"
            (blur)="isFocused.set(false)"
            [disabled]="isSubmitting()"
          />
          <button
            type="submit"
            [disabled]="!query() || isSubmitting()"
            class="absolute right-2 top-2 bottom-2 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-white rounded-lg px-5 font-semibold transition-all transform active:scale-95 disabled:opacity-40 disabled:active:scale-100 shadow-md text-sm">
            <span *ngIf="!isSubmitting()">Log</span>
            <span *ngIf="isSubmitting()" class="animate-pulse">...</span>
          </button>
        </div>
      </form>

      <!-- Success feedback -->
      <div
        class="mt-3 text-sm transition-all duration-300 text-primary-300 relative z-10"
        [class.opacity-100]="showSuccess()"
        [class.opacity-0]="!showSuccess()">
        ✓ Logged!
      </div>
    </div>
  `
})
export class SmartLoggerComponent implements AfterViewInit {
  tracker = inject(TrackerService);

  @ViewChild('loggerInput') loggerInput!: ElementRef<HTMLInputElement>;

  query = signal('');
  isFocused = signal(false);
  isSubmitting = signal(false);
  showSuccess = signal(false);
  showDatePicker = signal(false);
  selectedDate = new Date().toISOString().split('T')[0];
  todayStr = new Date().toISOString().split('T')[0];

  selectedDateLabel() {
    const d = new Date(this.selectedDate);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  ngAfterViewInit() {
    setTimeout(() => {
      if (this.loggerInput) this.loggerInput.nativeElement.focus();
    }, 100);
  }

  onSubmit() {
    if (!this.query()) return;
    this.isSubmitting.set(true);

    const date = this.showDatePicker() ? this.selectedDate : this.todayStr;

    this.tracker.logSmartTransaction(this.query(), date).subscribe({
      next: () => {
        this.query.set('');
        this.isSubmitting.set(false);
        this.showSuccess.set(true);
        setTimeout(() => this.showSuccess.set(false), 2000);
      },
      error: (err) => {
        console.error(err);
        this.isSubmitting.set(false);
      }
    });
  }
}
