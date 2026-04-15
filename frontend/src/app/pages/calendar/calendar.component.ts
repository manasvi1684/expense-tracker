import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrackerService } from '../../services/tracker.service';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col gap-6">
      <header class="flex justify-between items-center mb-2">
        <div>
          <h1 class="text-3xl font-bold tracking-tight text-white focus">Timeline</h1>
          <p class="text-gray-400 text-sm">Tap a day to see its events.</p>
        </div>
      </header>

      <div class="glass-card overflow-hidden">
        <div class="p-4 border-b border-white/5 bg-white/5">
           <h3 class="font-semibold text-primary-300 text-lg flex items-center justify-between">
              <button class="text-gray-400 hover:text-white">&larr;</button>
              {{ currentMonthName }}
              <button class="text-gray-400 hover:text-white">&rarr;</button>
           </h3>
        </div>
        
        <div class="grid grid-cols-7 text-center text-xs font-medium text-gray-500 py-3 bg-dark-900/50">
           <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
        </div>
        
        <div class="grid grid-cols-7 gap-[1px] bg-white/5">
           <!-- Empty prior days -->
           <div *ngFor="let empty of emptyDays" class="bg-dark-800/50 min-h-[60px] p-1"></div>
           
           <!-- Actual days -->
           <div *ngFor="let day of monthDays" 
                (click)="selectDay(day)"
                class="bg-dark-800 min-h-[60px] p-1 border-t-2 transition-all cursor-pointer hover:bg-dark-700"
                [ngClass]="{'border-transparent': !hasTransactions(day), 'border-primary-500': hasTransactions(day), 'bg-white/10': selectedDay === day}">
              <span class="text-xs font-semibold" [class.text-white]="hasTransactions(day)" [class.text-gray-500]="!hasTransactions(day)">
                 {{ day.getDate() }}
              </span>
              <div *ngIf="hasTransactions(day)" class="mt-1">
                 <span class="text-[10px] font-bold text-red-400 block truncate">-₹{{ getDailyTotal(day) }}</span>
                 <div class="w-1.5 h-1.5 rounded-full bg-primary-500 mx-auto mt-1"></div>
              </div>
           </div>
        </div>
      </div>

      <!-- Selected Day Details -->
      <div *ngIf="selectedDay" class="glass-card p-5 mt-4 min-h-[200px] mb-8 relative overflow-hidden">
         <div class="absolute -right-4 -bottom-4 w-32 h-32 bg-primary-500/10 rounded-full blur-2xl pointer-events-none"></div>
         <h4 class="text-lg font-bold text-white mb-4">{{ selectedDay | date:'fullDate' }}</h4>
         
         <div *ngIf="!hasTransactions(selectedDay)" class="text-gray-500 text-sm text-center mt-8">
            No transactions on this day.
         </div>

         <div *ngIf="hasTransactions(selectedDay)" class="flex flex-col gap-3">
             <div *ngFor="let tx of getTransactionsForDay(selectedDay)" class="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/5">
                <div>
                   <p class="font-medium text-white">{{ tx.category?.name || 'Other' }}</p>
                   <p class="text-xs text-gray-400">{{ tx.description }}</p>
                </div>
                <p class="font-bold text-red-400">-₹{{ tx.amount }}</p>
             </div>
         </div>
      </div>
    </div>
  `
})
export class CalendarComponent {
  tracker = inject(TrackerService);
  
  today = new Date();
  currentMonthDate = new Date(this.today.getFullYear(), this.today.getMonth(), 1);
  selectedDay: Date | null = this.today;

  get currentMonthName() {
    return this.currentMonthDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  }

  get emptyDays() {
    const firstDay = this.currentMonthDate.getDay();
    return Array(firstDay).fill(null);
  }

  get monthDays() {
    const year = this.currentMonthDate.getFullYear();
    const month = this.currentMonthDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return Array.from({length: daysInMonth}, (_, i) => new Date(year, month, i + 1));
  }

  isSameDay(d1: Date, d2: Date) {
    return d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();
  }

  getTransactionsForDay(day: Date) {
    return this.tracker.transactions().filter(tx => this.isSameDay(new Date(tx.date), day));
  }

  hasTransactions(day: Date) {
    return this.getTransactionsForDay(day).length > 0;
  }

  getDailyTotal(day: Date) {
    return this.getTransactionsForDay(day).reduce((acc, tx) => acc + tx.amount, 0);
  }

  selectDay(day: Date) {
    this.selectedDay = day;
  }
}
