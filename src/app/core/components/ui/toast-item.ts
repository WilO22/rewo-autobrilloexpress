import { Component, input, output } from '@angular/core';
import { Toast } from '../../services/ui/toast';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-toast-item',
  imports: [CommonModule],
  template: `
    <div 
      [class]="'group relative flex items-center justify-between p-4 rounded-xl border backdrop-blur-md shadow-2xl transition-all duration-300 transform translate-x-0 opacity-100 ' + bgClass()"
      role="alert"
    >
      <div class="flex items-center gap-3">
        <!-- Icono dinámico según el tipo -->
        <span [class]="'p-2 rounded-lg ' + iconBgClass()">
          @if (toast().type === 'success') {
            <svg class="h-5 w-5 text-app-success" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
          } @else if (toast().type === 'error') {
            <svg class="h-5 w-5 text-app-danger" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>
          } @else if (toast().type === 'warning') {
            <svg class="h-5 w-5 text-app-warning" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
          } @else {
            <svg class="h-5 w-5 text-app-accent" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>
          }
        </span>
        
        <p class="text-sm font-medium text-white/90">{{ toast().message }}</p>
      </div>

      <button 
        (click)="close.emit()"
        class="ml-4 p-1 rounded-md text-white/30 hover:text-white/80 hover:bg-white/5 transition-all"
        aria-label="Cerrar"
      >
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <!-- Barra de progreso (opcional) -->
      @if (toast().duration) {
        <div 
          class="absolute bottom-0 left-0 h-0.5 bg-white/20 transition-all duration-linear"
          [style.width.%]="100"
          [style.transitionDuration.ms]="toast().duration"
        ></div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class ToastItem {
  toast = input.required<Toast>();
  close = output();

  bgClass() {
    switch (this.toast().type) {
      case 'success': return 'bg-app-success/10 border-app-success/20';
      case 'error': return 'bg-app-danger/10 border-app-danger/20';
      case 'warning': return 'bg-app-warning/10 border-app-warning/20';
      default: return 'bg-white/5 border-app-accent/20';
    }
  }

  iconBgClass() {
    switch (this.toast().type) {
      case 'success': return 'bg-app-success/10';
      case 'error': return 'bg-app-danger/10';
      case 'warning': return 'bg-app-warning/10';
      default: return 'bg-app-accent/10';
    }
  }
}
