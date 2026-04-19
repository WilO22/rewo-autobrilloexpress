import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-modal',
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <!-- Backdrop Disruptivo -->
      <div class="absolute inset-0 bg-gray-950/80 backdrop-blur-md animate-in fade-in duration-500"></div>
      
      <!-- Modal Card con Glassmorphism -->
      <div class="relative w-full max-w-sm bg-gray-900/40 border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in slide-in-from-bottom-8 duration-500 backdrop-blur-2xl">
        <!-- Glow Decorativo Superior -->
        <div class="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-transparent" 
             [ngClass]="isDestructive() ? 'via-app-danger' : 'via-app-accent'"
             class="to-transparent opacity-50 shadow-[0_0_15px_var(--app-glow)]"></div>
        
        <div class="p-8 pb-6 space-y-6">
          <div class="flex flex-col items-center text-center gap-5">
            <!-- Icono Reactivo -->
            <div class="p-4 rounded-3xl transition-all duration-500"
                 [ngClass]="isDestructive() ? 'bg-app-danger/10 text-app-danger shadow-[0_0_20px_var(--app-danger-glow)]' : 'bg-app-accent/10 text-app-accent shadow-[0_0_20px_var(--app-glow)]'">
              <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                @if (isDestructive()) {
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                } @else {
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                }
              </svg>
            </div>

            <div class="space-y-2">
              <h2 class="text-2xl font-black text-white tracking-tighter">{{ title() }}</h2>
              <p class="text-gray-400 text-sm font-medium leading-relaxed px-2">{{ message() }}</p>
            </div>
          </div>

          <!-- Acciones con Micro-interacciones -->
          <div class="flex flex-col gap-3">
            <button 
              (click)="onConfirm.emit()"
              [ngClass]="isDestructive() ? 'bg-app-danger text-white shadow-[0_0_20px_var(--app-danger-glow)]' : 'bg-app-accent text-gray-900 shadow-app-glow'"
              class="w-full px-6 py-3.5 font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all hover:scale-[1.02] hover:brightness-110 active:scale-95 cursor-pointer"
            >
              {{ confirmText() }}
            </button>
            <button 
              (click)="onCancel.emit()"
              class="w-full px-6 py-3.5 bg-white/5 border border-white/10 text-gray-400 font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-white/10 hover:text-white transition-all cursor-pointer"
            >
              {{ cancelText() }}
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
  isDestructive = input<boolean>(true);

  onConfirm = output<void>();
  onCancel = output<void>();
}
