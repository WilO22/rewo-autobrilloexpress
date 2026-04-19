import { Component, input, output, computed, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-paginator',
  template: `
    <div class="flex items-center justify-between px-4 py-3 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
      <div class="flex items-center gap-4">
        <span class="text-xs font-bold text-gray-500 uppercase tracking-widest">
          Total: <span class="text-cian">{{ total() }}</span>
        </span>
      </div>

      <div class="flex items-center gap-2">
        <button (click)="goToPage(current() - 1)" 
                [disabled]="current() === 1"
                class="p-2 rounded-xl border border-white/10 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-gray-400 hover:text-white">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
        </button>

        <div class="flex items-center px-4 py-2 bg-navy/40 rounded-lg border border-white/5">
          <span class="text-sm font-bold text-white">
            Página <span class="text-cian">{{ current() }}</span> de {{ totalPages() }}
          </span>
        </div>

        <button (click)="goToPage(current() + 1)" 
                [disabled]="current() === totalPages() || totalPages() === 0"
                class="p-2 rounded-xl border border-white/10 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-gray-400 hover:text-white">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
        </button>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppPaginator {
  total = input.required<number>();
  size = input.required<number>();
  current = input.required<number>();
  
  pageChange = output<number>();

  totalPages = computed(() => Math.ceil(this.total() / this.size()));

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.pageChange.emit(page);
    }
  }
}
