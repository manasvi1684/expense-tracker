import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TrackerService, Category } from '../../services/tracker.service';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex flex-col gap-6">
      <header class="flex justify-between items-center mb-2">
        <div>
          <h1 class="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-primary-200 bg-clip-text text-transparent">Budgets</h1>
          <p class="text-gray-400 text-sm mt-1">Set, edit, or delete your spending categories.</p>
        </div>
        <button (click)="toggleAddForm()" class="bg-primary-500 hover:bg-primary-400 text-white rounded-full w-10 h-10 flex items-center justify-center transition-all shadow-lg shadow-primary-500/20 hover:scale-110">
          <svg class="w-5 h-5 transition-transform" [class.rotate-45]="showAddForm()" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        </button>
      </header>

      <!-- ADD FORM -->
      <div *ngIf="showAddForm()" class="glass-card p-5 border border-primary-500/20 animate-fadeIn">
        <h3 class="text-white font-semibold mb-4">New Category</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Name</label>
            <input type="text" [(ngModel)]="newName" name="newName" placeholder="e.g. Food"
              class="w-full bg-dark-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500">
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Monthly Budget (₹)</label>
            <input type="number" [(ngModel)]="newBudget" name="newBudget" placeholder="e.g. 5000"
              class="w-full bg-dark-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500">
          </div>
          <div class="md:col-span-2">
            <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Keywords (comma-separated, for auto-tagging)</label>
            <input type="text" [(ngModel)]="newKeywords" name="newKeywords" placeholder="e.g. zomato, swiggy, lunch, restaurant"
              class="w-full bg-dark-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500">
          </div>
        </div>
        <button (click)="addCategory()" [disabled]="!newName || saving()"
          class="mt-4 w-full bg-primary-600 hover:bg-primary-500 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50">
          <span *ngIf="!saving()">Add Category</span>
          <span *ngIf="saving()" class="animate-pulse">Saving...</span>
        </button>
      </div>

      <!-- EMPTY STATE -->
      <div *ngIf="!tracker.categories().length" class="text-center p-14 border border-dashed border-white/10 rounded-2xl bg-white/5">
        <svg class="w-12 h-12 text-gray-700 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
        <p class="text-gray-400 font-medium">No categories yet. Tap + to create one.</p>
      </div>

      <!-- CATEGORY LIST -->
      <div class="flex flex-col gap-4">
        <div *ngFor="let cat of categoriesWithUsage()" class="glass-card overflow-hidden group">

          <!-- VIEW MODE -->
          <div *ngIf="editingId() !== cat.id" class="p-5">
            <div class="flex justify-between items-start mb-4">
              <div>
                <h3 class="text-lg font-bold text-white capitalize">{{ cat.name }}</h3>
                <p class="text-xs text-gray-500 mt-0.5">{{ cat.keywords || 'No keywords' }}</p>
              </div>
              <div class="flex items-center gap-2">
                <!-- Edit button -->
                <button (click)="startEdit(cat)"
                  class="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-primary-400 hover:bg-primary-500/10 transition-all">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                </button>
                <!-- Delete button -->
                <button (click)="deleteCategory(cat.id)"
                  class="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              </div>
            </div>
            <!-- Spend vs Budget -->
            <div class="flex justify-between text-sm mb-2">
              <span class="text-gray-400">₹{{ cat.spent | number:'1.0-0' }} spent</span>
              <span [ngClass]="cat.percentage > 80 ? 'text-red-400' : 'text-primary-400'" class="font-semibold">
                ₹{{ cat.budget | number:'1.0-0' }} budget · {{ cat.percentage.toFixed(0) }}%
              </span>
            </div>
            <div class="w-full bg-dark-900 rounded-full h-2 overflow-hidden">
              <div class="h-2 rounded-full transition-all duration-1000"
                [style.width.%]="cat.percentage"
                [ngClass]="cat.percentage > 90 ? 'bg-red-500' : cat.percentage > 75 ? 'bg-orange-400' : 'bg-primary-500'">
              </div>
            </div>
            <div *ngIf="cat.percentage > 80" class="mt-3 text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-lg border border-red-500/20 flex justify-between">
              <span>⚠ Approaching limit</span><span>{{ cat.percentage.toFixed(0) }}%</span>
            </div>
          </div>

          <!-- EDIT MODE (inline) -->
          <div *ngIf="editingId() === cat.id" class="p-5 bg-primary-500/5 border-l-2 border-primary-500">
            <p class="text-xs font-semibold text-primary-400 uppercase tracking-wider mb-4">Editing: {{ cat.name }}</p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs text-gray-400 mb-1">Name</label>
                <input type="text" [(ngModel)]="editName" name="editName"
                  class="w-full bg-dark-900/50 border border-primary-500/40 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500">
              </div>
              <div>
                <label class="block text-xs text-gray-400 mb-1">Monthly Budget (₹)</label>
                <input type="number" [(ngModel)]="editBudget" name="editBudget"
                  class="w-full bg-dark-900/50 border border-primary-500/40 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500">
              </div>
              <div class="md:col-span-2">
                <label class="block text-xs text-gray-400 mb-1">Keywords</label>
                <input type="text" [(ngModel)]="editKeywords" name="editKeywords"
                  class="w-full bg-dark-900/50 border border-primary-500/40 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500">
              </div>
            </div>
            <div class="flex gap-3 mt-4">
              <button (click)="saveEdit(cat.id)" [disabled]="saving()"
                class="flex-1 bg-primary-600 hover:bg-primary-500 text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50 text-sm">
                <span *ngIf="!saving()">Save Changes</span>
                <span *ngIf="saving()" class="animate-pulse">Saving...</span>
              </button>
              <button (click)="editingId.set(null)"
                class="px-5 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white transition-colors text-sm">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class CategoriesComponent {
  tracker = inject(TrackerService);

  showAddForm = signal(false);
  saving = signal(false);
  editingId = signal<number | null>(null);

  // Add form fields
  newName = '';
  newBudget: number | null = null;
  newKeywords = '';

  // Edit form fields
  editName = '';
  editBudget: number | null = null;
  editKeywords = '';

  toggleAddForm() {
    this.showAddForm.set(!this.showAddForm());
    this.editingId.set(null);
  }

  startEdit(cat: Category) {
    this.editingId.set(cat.id);
    this.editName = cat.name;
    this.editBudget = cat.budget ?? null;
    this.editKeywords = cat.keywords ?? '';
    this.showAddForm.set(false);
  }

  categoriesWithUsage = computed(() => {
    const cats = this.tracker.categories();
    const breakdown = this.tracker.insights()?.category_breakdown || {};
    return cats.map(c => {
      const rawSpent = breakdown[c.name] ?? 0;
      const spent = Math.max(0, rawSpent);   // clamp: refunds can drive net negative
      const budget = c.budget || 1;
      return {
        ...c,
        spent: rawSpent,                     // show real (possibly negative) value in text
        budget,
        percentage: Math.max(0, Math.min(100, (spent / budget) * 100))
      };
    });
  });

  addCategory() {
    if (!this.newName) return;
    this.saving.set(true);
    this.tracker.addCategory(this.newName, Number(this.newBudget) || 0, this.newKeywords).subscribe({
      next: () => {
        this.newName = '';
        this.newBudget = null;
        this.newKeywords = '';
        this.saving.set(false);
        this.showAddForm.set(false);
      },
      error: () => this.saving.set(false)
    });
  }

  saveEdit(id: number) {
    this.saving.set(true);
    this.tracker.updateCategory(id, this.editName, Number(this.editBudget) || 0, this.editKeywords).subscribe({
      next: () => { this.saving.set(false); this.editingId.set(null); },
      error: (e) => { console.error('Edit failed', e); this.saving.set(false); }
    });
  }

  deleteCategory(id: number) {
    this.tracker.deleteCategory(id).subscribe({
      error: (e) => console.error('Delete failed', e)
    });
  }
}
