import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrackerService } from '../../services/tracker.service';

@Component({
  selector: 'app-insights',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="glass-card p-5 mt-6 border-l-4 border-l-primary-500 overflow-hidden relative">
      <div class="absolute -right-10 -bottom-10 w-32 h-32 bg-primary-500/10 rounded-full blur-2xl pointer-events-none"></div>
      
      <div class="flex items-center gap-3 mb-3">
        <svg class="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
        <h3 class="text-sm font-semibold tracking-wide text-primary-400 uppercase">Assistant Insights</h3>
      </div>
      
      <div *ngIf="tracker.insights() as insights; else loading" class="flex flex-col gap-2 relative z-10">
        <div *ngFor="let msg of insights.messages" class="flex gap-2">
           <span class="text-primary-500">•</span>
           <p class="text-sm text-gray-200">{{ msg }}</p>
        </div>
      </div>
      
      <ng-template #loading>
        <p class="text-sm text-gray-500 animate-pulse">Analyzing patterns...</p>
      </ng-template>
    </div>
  `
})
export class InsightsComponent {
  tracker = inject(TrackerService);
}
