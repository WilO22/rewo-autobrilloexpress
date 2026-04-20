import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-customer-identity',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="identity-card relative overflow-hidden bg-gray-900/40 p-4 md:px-7 md:py-4 rounded-3xl border border-white/5 backdrop-blur-xl flex flex-col md:flex-row justify-between items-center gap-6 group">
      <!-- Glow Decorator -->
      <div class="absolute -inset-24 bg-app-accent/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000 -z-10"></div>
      
      <div class="flex items-center gap-6 w-full md:w-auto">
        <!-- Avatar Wrapper -->
        <div class="relative">
          <div class="absolute inset-0 bg-app-accent blur-md opacity-20 animate-pulse rounded-2xl"></div>
          <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-app-accent to-app-secondary flex items-center justify-center text-gray-900 text-3xl font-black shadow-app-glow border border-white/10 shrink-0">
            {{ name().charAt(0) }}
          </div>
        </div>
 
        <div class="flex flex-col">
          <div class="flex items-center gap-4">
            <h1 class="text-2xl md:text-4xl font-black text-white tracking-tighter leading-none">{{ name() }}</h1>
            <span class="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black text-app-accent uppercase tracking-widest shadow-inner">Nivel Basic</span>
          </div>
          <p class="text-gray-500 text-sm font-medium mt-1.5 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 opacity-50 text-app-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            {{ email() }}
          </p>
        </div>
      </div>

      <!-- Stats Section - Compact Horizontal -->
      <div class="flex items-center gap-8 px-8 py-3.5 bg-gradient-to-r from-white/5 to-transparent rounded-2xl border border-white/5 backdrop-blur-sm w-full md:w-auto justify-between md:justify-start">
        <div class="text-center md:text-right">
          <p class="text-gray-500 text-[9px] font-black uppercase tracking-[0.2em] mb-1">Acumulados</p>
          <div class="flex items-baseline justify-center md:justify-end gap-1.5">
            <span class="text-3xl font-black text-white leading-none tracking-tighter">{{ points() }}</span>
            <span class="text-app-accent text-[9px] font-black uppercase tracking-widest">pts</span>
          </div>
        </div>
        
        <div class="w-px h-10 bg-white/10 hidden md:block"></div>

        <div class="hidden lg:block text-right">
          <p class="text-gray-500 text-[9px] font-black uppercase tracking-[0.2em] mb-1">Próxima Meta</p>
          <p class="text-white font-black text-xs uppercase tracking-tight">Silver <span class="text-app-accent/60 mx-1">/</span> <span class="text-gray-400 font-bold">500 pts</span></p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .identity-card {
      box-shadow: 0 10px 30px -10px rgba(0,0,0,0.5);
      transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.3s ease;
    }
    .identity-card:hover {
      border-color: var(--app-border);
      transform: translateY(-2px);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomerIdentityComponent {
  name = input.required<string>();
  email = input.required<string>();
  points = input<number>(0);
}
