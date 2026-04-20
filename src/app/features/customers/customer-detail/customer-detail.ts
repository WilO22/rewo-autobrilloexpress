import { Component, inject, computed, signal, linkedSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal, rxResource } from '@angular/core/rxjs-interop';
import { map, of } from 'rxjs';
import { Customers } from '../../../core/services/customer';
import { Memberships } from '../../../core/services/membership';
import { Toasts } from '../../../core/services/ui/toast';
import { Customer, Membership } from '../../../core/models';

import { ChangeDetectionStrategy } from '@angular/core';
import { CustomerIdentityComponent } from './components/customer-identity.component';
import { ActiveMembershipComponent, MembershipInfo } from './components/active-membership.component';
import { PlanSelectorComponent } from './components/plan-selector.component';

@Component({
  selector: 'app-customer-detail',
  standalone: true,
  imports: [
    CommonModule, 
    RouterLink,
    CustomerIdentityComponent,
    ActiveMembershipComponent,
    PlanSelectorComponent
  ],
  templateUrl: './customer-detail.html',
  styleUrl: './customer-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomerDetail {
  private route = inject(ActivatedRoute);
  private customerService = inject(Customers);
  private membershipService = inject(Memberships);
  private toastService = inject(Toasts);

  // Cargando estado
  loading = signal(false);

  // 1. Recursos Reactivos (ARCH-EDO-1: Carga declarativa)
  private id$ = this.route.paramMap.pipe(map(params => params.get('id')!));
  customerId = toSignal(this.id$);

  customerResource = rxResource<Customer | undefined, string | undefined>({
    params: () => this.customerId(),
    stream: ({ params: id }) => id ? this.customerService.getCustomer(id) : of(undefined)
  });

  membershipsResource = rxResource<Membership[], void>({
    stream: () => this.membershipService.getMemberships()
  });

  // Alias para conveniencia en el template
  customer = computed(() => this.customerResource.value());
  memberships = computed(() => this.membershipsResource.value() ?? []);

  /** 
   * Sincronización de selección (Modern Angular Pattern)
   * Se reinicia automáticamente cuando el recurso del cliente cambia.
   */
  selectedMembershipId = linkedSignal({
    source: () => this.customer()?.membershipId,
    computation: (id) => id ?? null
  });

  // 3. Obtener la membresía actual del cliente (si tiene una)
  activeMembership = computed(() => {
    const cust = this.customer();
    const all = this.memberships();
    if (!cust || !cust.membershipId || !all) return null;
    return all.find(m => m.id === cust.membershipId);
  });

  /** Asignar o cambiar membresía */
  async onAssignMembership(membershipId: string) {
    const id = this.customer()?.id;
    if (!id) return;

    try {
      this.loading.set(true);
      this.selectedMembershipId.set(membershipId); // Optimistic UI
      await this.customerService.updateCustomer(id, { membershipId });
      this.toastService.show('Membresía asignada correctamente', 'success');
      // Recargamos para asegurar consistencia
      this.customerResource.reload();
    } catch (error: any) {
      console.error('Error al asignar membresía:', error);
      this.toastService.show('No se pudo asignar la membresía', 'error');
      // Revertimos en caso de error
      this.selectedMembershipId.set(this.customer()?.membershipId ?? null);
    } finally {
      this.loading.set(false);
    }
  }

  /** Quitar membresía (Volver a BASIC) */
  async onRemoveMembership() {
    const id = this.customer()?.id;
    if (!id) return;

    try {
      this.loading.set(true);
      await this.customerService.updateCustomer(id, { membershipId: null });
      this.toastService.show('Membresía removida', 'success');
      this.customerResource.reload();
    } catch (error: any) {
      this.toastService.show('Error al remover membresía', 'error');
    } finally {
      this.loading.set(false);
    }
  }
}
