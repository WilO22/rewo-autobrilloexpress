import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (loading()) {
      <div [class]="overlay() ? 'fixed inset-0 z-[100] flex items-center justify-center bg-gray-950/60 backdrop-blur-sm' : 'flex items-center justify-center p-4'">
        <div class="relative flex flex-col items-center gap-4">
          <!-- Círculo Ártico -->
          <div [class]="sizeClasses" 
               class="border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin shadow-[0_0_20px_rgba(34,211,238,0.3)]">
          </div>
          
          <!-- Texto opcional -->
          @if (message()) {
            <span class="text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em] animate-pulse">
              {{ message() }}
            </span>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: block; }
    .size-sm { width: 1.5rem; height: 1.5rem; border-width: 2px; }
    .size-md { width: 3rem; height: 3rem; border-width: 4px; }
    .size-lg { width: 5rem; height: 5rem; border-width: 6px; }
  `]
})
export class ArcticSpinner {
  loading = input<boolean>(false);
  overlay = input<boolean>(false);
  message = input<string>('');
  size = input<'sm' | 'md' | 'lg'>('md');

  get sizeClasses(): string {
    return `size-${this.size()}`;
  }
}
