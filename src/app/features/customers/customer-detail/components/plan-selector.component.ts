import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { MembershipInfo } from './active-membership.component';

@Component({
  selector: 'app-plan-selector',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  template: `
    <div class="h-full bg-gray-900/40 rounded-3xl p-4 md:p-5 border border-cyan-500/10 backdrop-blur-md flex flex-col">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-base font-bold text-white uppercase tracking-tighter">Asignar Plan</h2>
        <span class="text-[9px] bg-white/5 text-gray-500 font-black px-2 py-0.5 rounded border border-white/5 uppercase tracking-widest">Disponibles</span>
      </div>
      
      <div class="flex-1 overflow-y-auto custom-scrollbar pr-2 -mr-2">
        <div class="grid grid-cols-1 gap-2.5">
          @if (loading()) {
            @for (i of [1,2,3]; track i) {
              <div class="h-20 bg-white/5 rounded-2xl animate-pulse border border-white/5"></div>
            }
          } @else {
            @for (m of plans(); track m.id) {
              <button (click)="select.emit(m.id)"
                      [disabled]="actionLoading() || activeId() === m.id"
                      class="w-full text-left p-3.5 rounded-xl border transition-all duration-300 flex justify-between items-center group relative overflow-hidden disabled:opacity-50"
                      [class]="activeId() === m.id 
                              ? 'bg-app-accent/10 border-app-accent/40 cursor-default shadow-[inset_0_0_20px_rgba(34,211,238,0.05)]' 
                              : 'bg-gray-800/40 border-white/5 hover:bg-gray-800 hover:border-app-accent/30 hover:shadow-app-glow/10 hover:-translate-y-0.5'">
                
                @if (activeId() === m.id && actionLoading()) {
                  <div class="absolute inset-0 bg-app-accent/5 animate-pulse"></div>
                }

                <div class="z-10 flex flex-col">
                  <p class="font-black tracking-tight text-sm" [class]="activeId() === m.id ? 'text-app-accent' : 'text-gray-100'">
                    {{ m.name }}
                  </p>
                  <div class="flex items-center gap-2 mt-0.5">
                     <span class="text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter"
                           [class]="activeId() === m.id ? 'bg-app-accent text-gray-900' : 'bg-gray-700 text-gray-400'">
                      {{ m.type }}
                    </span>
                  </div>
                </div>

                <div class="flex flex-col items-end z-10">
                  <span class="text-base font-black text-white">$ {{ m.price | number }}</span>
                  @if (activeId() === m.id) {
                    <div class="mt-1 flex items-center gap-1 text-app-accent">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                      </svg>
                      <span class="text-[8px] font-black uppercase">Plan Actual</span>
                    </div>
                  } @else {
                     <div class="mt-1 w-5 h-5 rounded-full border-2 border-gray-700 bg-gray-900 flex items-center justify-center group-hover:border-app-accent/50 transition-all group-hover:scale-110">
                       <svg xmlns="http://www.w3.org/2000/svg" class="h-2.5 w-2.5 text-app-accent opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4" />
                       </svg>
                     </div>
                  }
                </div>
              </button>
            } @empty {
              <div class="py-8 border-2 border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center text-center">
                 <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-gray-700 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                 </svg>
                 <p class="text-gray-600 text-xs italic">No hay planes disponibles.</p>
              </div>
            }
          }
        </div>
      </div>
      
      <div class="mt-4 pt-3 border-t border-white/5">
        <p class="text-[8px] text-gray-600 font-bold leading-relaxed uppercase tracking-widest">
          ⚠️ El alta de un nuevo plan cancelará el servicio vigente.
        </p>
      </div>
    </div>
  `,
  styles: [`:host { display: block; height: 100%; }`],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlanSelectorComponent {
  plans = input<MembershipInfo[]>([]);
  activeId = input<string | null>(null);
  loading = input<boolean>(false);
  actionLoading = input<boolean>(false);
  select = output<string>();
}
