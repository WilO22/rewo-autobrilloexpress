import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { Memberships } from '../../../core/services/membership';
import { Membership } from '../../../core/models';

@Component({
  selector: 'app-membership-list',
  imports: [CurrencyPipe],
  templateUrl: './membership-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'class': 'block animate-in fade-in duration-500'
  }
})
export class MembershipList {
  private membershipService = inject(Memberships);

  /** Catálogo de membresías reactivo */
  memberships = toSignal(this.membershipService.getMemberships(), { initialValue: [] as Membership[] });

  /**
   * Determina el color del badge según el tipo
   */
  getTypeBadgeClass(type: string): string {
    return type === 'ILIMITADO' 
      ? 'bg-app-accent/10 text-app-accent border-app-accent/30 shadow-[0_0_10px_var(--app-glow)]' 
      : 'bg-app-secondary/10 text-app-secondary border-app-secondary/30 shadow-[0_0_10px_var(--app-secondary-glow)]';
  }

  /**
   * Estilos dinámicos para la tarjeta
   */
  getCardClass(type: string): string {
    return type === 'ILIMITADO'
      ? 'hover:border-app-accent/40 hover:shadow-[0_0_30px_var(--app-glow)]'
      : 'hover:border-app-secondary/40 hover:shadow-[0_0_30px_var(--app-secondary-glow)]';
  }

  /**
   * Colores de brillo de fondo
   */
  getGlowClass(type: string): string {
    return type === 'ILIMITADO'
      ? 'bg-app-accent/5 group-hover:bg-app-accent/10'
      : 'bg-app-secondary/5 group-hover:bg-app-secondary/10';
  }
}
