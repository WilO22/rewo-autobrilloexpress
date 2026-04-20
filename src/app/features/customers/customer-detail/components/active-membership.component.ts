import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface MembershipInfo {
  id: string;
  name: string;
  type: string;
  price: number;
}

@Component({
  selector: 'app-active-membership',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="h-full bg-gray-900/60 rounded-3xl p-4 md:p-5 border border-white/5 relative group transition-all hover:border-app-border/30">
      <h2 class="text-base font-bold text-white mb-4 flex items-center gap-3">
        <div class="p-1.5 bg-app-accent/10 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-app-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
          </svg>
        </div>
        Membresía Operativa
      </h2>

      @if (loading()) {
        <div class="h-32 flex flex-col items-center justify-center space-y-4">
          <div class="w-6 h-6 border-2 border-app-accent/10 border-t-app-accent rounded-full animate-spin"></div>
          <p class="text-[8px] text-app-accent/50 font-black tracking-[0.2em] uppercase">Consultando...</p>
        </div>
      } @else if (membership()) {
        <div class="bg-gradient-to-br from-gray-800/80 to-gray-900/90 p-5 md:p-6 group/card rounded-2xl border border-app-accent/20 shadow-2xl relative overflow-hidden">
          <!-- Active Badge -->
          <div class="absolute top-0 right-0 p-3">
            <div class="relative flex items-center justify-center">
              <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-app-accent opacity-20"></span>
              <span class="relative bg-app-accent text-gray-900 text-[8px] font-black px-1.5 py-0.5 rounded-md tracking-tighter uppercase">ACTIVO</span>
            </div>
          </div>
          
          <p class="text-app-accent text-[10px] font-black uppercase tracking-widest mb-1 opacity-70">Plan Actual</p>
          <h3 class="text-2xl md:text-3xl font-black text-white mb-4 leading-tight tracking-tight">{{ membership()?.name }}</h3>
          
          <div class="grid grid-cols-2 gap-3 mt-5">
            <div class="bg-white/5 p-3 rounded-xl border border-white/5 backdrop-blur-sm">
              <p class="text-gray-500 text-[9px] font-black uppercase tracking-[0.15em] mb-1">Categoría</p>
              <p class="text-white font-bold text-sm">{{ membership()?.type }}</p>
            </div>
            <div class="bg-white/5 p-3 rounded-xl border border-white/5 backdrop-blur-sm">
              <p class="text-gray-500 text-[9px] font-black uppercase tracking-[0.15em] mb-1">Inversión</p>
              <p class="text-white font-bold text-xl leading-none">{{ membership()?.price | currency:'USD':'symbol':'1.0-0' }}</p>
            </div>
          </div>

          <div class="mt-5 flex justify-between items-center">
             <button (click)="remove.emit()" 
                    [disabled]="actionLoading()"
                    class="group/btn text-red-400/70 hover:text-red-400 text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 disabled:opacity-30">
              <div class="w-7 h-7 rounded-lg bg-red-400/5 flex items-center justify-center group-hover/btn:bg-red-400/10 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              Finalizar suscripción
            </button>
          </div>
        </div>
      } @else {
        <div class="h-64 border-2 border-dashed border-gray-800/50 rounded-3xl flex flex-col items-center justify-center text-center p-8 transition-colors hover:border-app-accent/20">
          <div class="w-16 h-16 bg-gray-800/30 rounded-2xl flex items-center justify-center text-gray-700 mb-4 group-hover:text-app-accent/40 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 class="text-gray-300 font-bold text-lg tracking-tight">Sin Membresía Activa</h3>
          <p class="text-gray-500 text-sm mt-1 max-w-[200px] leading-relaxed">Este cliente no cuenta con beneficios recurrentes por ahora.</p>
        </div>
      }
    </div>
  `,
  styles: [`:host { display: block; height: 100%; }`],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActiveMembershipComponent {
  membership = input<MembershipInfo | null | undefined>(null);
  loading = input<boolean>(false);
  actionLoading = input<boolean>(false);
  remove = output<void>();
}
