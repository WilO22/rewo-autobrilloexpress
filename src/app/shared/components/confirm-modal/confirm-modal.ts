import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-navy/80 backdrop-blur-md animate-in fade-in duration-300"></div>
      
      <!-- Modal Card -->
      <div class="relative w-full max-w-sm bg-navy border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in slide-in-from-bottom-4 duration-300">
        <div class="p-8 space-y-6">
          <div class="flex flex-col items-center text-center gap-4">
            <div class="p-4 bg-rose-500/10 rounded-full text-rose-500">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
            </div>
            <div class="space-y-2">
              <h2 class="text-2xl font-bold text-white">{{ title() }}</h2>
              <p class="text-gray-400 leading-relaxed">{{ message() }}</p>
            </div>
          </div>

          <div class="flex gap-3">
            <button 
              (click)="onCancel.emit()"
              class="flex-1 px-6 py-3 border border-white/10 text-gray-400 font-bold rounded-xl hover:bg-white/5 transition-all cursor-pointer"
            >
              {{ cancelText() }}
            </button>
            <button 
              (click)="onConfirm.emit()"
              class="flex-1 px-6 py-3 bg-rose-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(244,63,94,0.3)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              {{ confirmText() }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ConfirmModal {
  title = input<string>('¿Estás seguro?');
  message = input<string>('Esta acción no se puede deshacer.');
  confirmText = input<string>('Eliminar');
  cancelText = input<string>('Cancelar');

  onConfirm = output<void>();
  onCancel = output<void>();
}
