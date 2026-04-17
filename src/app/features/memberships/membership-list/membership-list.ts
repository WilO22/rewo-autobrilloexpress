import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { MembershipService } from '../../../core/services/membership';
import { Membership } from '../../../core/models';

@Component({
  selector: 'app-membership-list',
  standalone: true,
  imports: [CurrencyPipe],
  templateUrl: './membership-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'class': 'block animate-in fade-in duration-500'
  }
})
export class MembershipList {
  private membershipService = inject(MembershipService);

  /** Catálogo de membresías reactivo */
  memberships = toSignal(this.membershipService.getMemberships(), { initialValue: [] as Membership[] });

  /**
   * Determina el color del badge según el tipo
   */
  getTypeBadgeClass(type: string): string {
    return type === 'ILIMITADO' 
      ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 shadow-[0_0_10px_rgba(34,211,238,0.2)]' 
      : 'bg-purple-500/10 text-purple-400 border-purple-500/30';
  }
}
