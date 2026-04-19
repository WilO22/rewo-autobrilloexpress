import { Injectable, signal, effect, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Branches } from './branch';

export interface ThemePalette {
  id: string;
  name: string;
  accent: string;
  secondary: string;
}

export const PALETTES: ThemePalette[] = [
  { id: 'cyber', name: 'Cyber Cyan', accent: '#22d3ee', secondary: '#6366f1' },
  { id: 'sunset', name: 'Sunset Orange', accent: '#ff5733', secondary: '#f59e0b' },
  { id: 'electric', name: 'Electric Purple', accent: '#a855f7', secondary: '#ec4899' },
  { id: 'emerald', name: 'Emerald Night', accent: '#10b981', secondary: '#3b82f6' },
  { id: 'rose', name: 'Ruby Rose', accent: '#f43f5e', secondary: '#8b5cf6' },
  { id: 'amber', name: 'Amber Glow', accent: '#f59e0b', secondary: '#f97316' },
  { id: 'indigo', name: 'Ocean Indigo', accent: '#6366f1', secondary: '#22d3ee' },
  { id: 'gold', name: 'Gold Rush', accent: '#eab308', secondary: '#10b981' },
  { id: 'slate', name: 'Slate Chrome', accent: '#94a3b8', secondary: '#64748b' },
  { id: 'crimson', name: 'Deep Crimson', accent: '#e11d48', secondary: '#a855f7' },
];

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private platformId = inject(PLATFORM_ID);
  private branchService = inject(Branches);
  
  // Señal del tema actual (Persistente)
  public currentTheme = signal<ThemePalette>(PALETTES[0]);

  // Eager Initialization: Hidratar tema inmediatamente
  private _boot = this.loadTheme();

  // SOLID: Motor de inyección centralizado
  private themeEffect = effect(() => {
    if (isPlatformBrowser(this.platformId)) {
      const branchTheme = this.branchService.currentTheme();
      const userTheme = this.currentTheme();
      const style = document.documentElement.style;
      
      const activeAccent = branchTheme.accent || userTheme.accent;
      const activeSecondary = branchTheme.secondary || userTheme.secondary;
      
      if (activeAccent) {
        style.setProperty('--dynamic-accent', activeAccent);
        style.setProperty('--dynamic-secondary', activeSecondary || '');
        
        const glow = branchTheme.glow || `${activeAccent}40`;
        const border = branchTheme.border || `${activeAccent}15`;
        const secondaryGlow = branchTheme.secondaryGlow || (activeSecondary ? `${activeSecondary}40` : '');
        
        style.setProperty('--dynamic-glow', glow);
        style.setProperty('--dynamic-border', border);
        style.setProperty('--dynamic-secondary-glow', secondaryGlow);
      }
    }
  });

  private loadTheme() {
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem('rewo_theme');
      if (saved) {
        const theme = PALETTES.find(p => p.id === saved);
        if (theme) this.currentTheme.set(theme);
      }
    }
  }

  public setPalette(paletteId: string) {
    const theme = PALETTES.find(p => p.id === paletteId);
    if (theme) {
      this.currentTheme.set(theme);
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem('rewo_theme', paletteId);
      }
    }
  }

  public getPalettes() {
    return PALETTES;
  }
}
