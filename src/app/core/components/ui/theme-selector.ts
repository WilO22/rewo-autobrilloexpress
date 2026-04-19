import { Component, inject, signal } from '@angular/core';
import { ThemeService } from '../../services/theme';

@Component({
  selector: 'app-theme-selector',
  template: `
    <div class="relative">
      <!-- Botón Gatillo -->
      <button 
        (click)="isOpen.set(!isOpen())"
        class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
        title="Cambiar Tema de Color"
      >
        <div class="flex -space-x-2">
            <div class="w-3 h-3 rounded-full border border-navy shadow-sm" [style.backgroundColor]="themeService.currentTheme().accent"></div>
            <div class="w-3 h-3 rounded-full border border-navy shadow-sm bg-indigo-400"></div>
            <div class="w-3 h-3 rounded-full border border-navy shadow-sm bg-rose-400"></div>
        </div>
        <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-white transition-colors">Tema</span>
      </button>

      <!-- Panel de Selección -->
      @if (isOpen()) {
        <div class="absolute right-0 mt-3 p-4 bg-navy/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl z-[100] w-64 animate-in fade-in zoom-in-95 duration-200">
          <div class="mb-3 px-1 flex justify-between items-center">
            <span class="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Selección Curada</span>
            <span class="text-[9px] text-app-accent font-bold">{{ themeService.currentTheme().name }}</span>
          </div>
          
          <div class="grid grid-cols-5 gap-3">
            @for (palette of themeService.getPalettes(); track palette.id) {
              <button 
                (click)="selectTheme(palette.id)"
                class="relative w-8 h-8 rounded-full border-2 transition-all hover:scale-110 active:scale-95"
                [style.backgroundColor]="palette.accent"
                [class.border-white]="themeService.currentTheme().id === palette.id"
                [class.border-transparent]="themeService.currentTheme().id !== palette.id"
                [title]="palette.name"
              >
                @if (themeService.currentTheme().id === palette.id) {
                    <div class="absolute inset-0 rounded-full animate-ping opacity-20" [style.backgroundColor]="palette.accent"></div>
                }
              </button>
            }
          </div>
          
          <div class="mt-4 pt-3 border-t border-white/5 text-[9px] text-gray-500 italic text-center">
            Diseños optimizados para legibilidad y contraste.
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class ThemeSelector {
  themeService = inject(ThemeService);
  isOpen = signal(false);

  selectTheme(paletteId: string) {
    this.themeService.setPalette(paletteId);
    this.isOpen.set(false);
  }
}
