import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { switchMap, map } from 'rxjs';
import { Customers } from '../../../core/services/customer';
import { Memberships } from '../../../core/services/membership';
import { Toasts } from '../../../core/services/ui/toast';

@Component({
  selector: 'app-customer-detail',
  imports: [CommonModule, RouterLink],
  templateUrl: './customer-detail.html'
})
export class CustomerDetail {
  private route = inject(ActivatedRoute);
  private customerService = inject(Customers);
  private membershipService = inject(Memberships);
  private toastService = inject(Toasts);

  // Cargando estado
  loading = signal(false);

  // 1. Capturar ID y cargar Cliente
  private customerId$ = this.route.paramMap.pipe(map(params => params.get('id')!));
  customer = toSignal(this.customerId$.pipe(
    switchMap(id => this.customerService.getCustomer(id))
  ));

  // 2. Cargar todas las membresías disponibles (para el selector)
  memberships = toSignal(this.membershipService.getMemberships(), { initialValue: [] });

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
      await this.customerService.updateCustomer(id, { membershipId });
      this.toastService.show('Membresía asignada correctamente', 'success');
    } catch (error: any) {
      console.error('Error al asignar membresía:', error);
      this.toastService.show('No se pudo asignar la membresía', 'error');
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
    } catch (error: any) {
      this.toastService.show('Error al remover membresía', 'error');
    } finally {
      this.loading.set(false);
    }
  }
}
