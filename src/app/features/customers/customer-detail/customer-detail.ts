import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { switchMap, map } from 'rxjs';
import { CustomerService } from '../../../core/services/customer';
import { MembershipService } from '../../../core/services/membership';
import { ToastService } from '../../../core/services/ui/toast';

@Component({
  selector: 'app-customer-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './customer-detail.html'
})
export class CustomerDetail {
  private route = inject(ActivatedRoute);
  private customerService = inject(CustomerService);
  private membershipService = inject(MembershipService);
  private toast = inject(ToastService);

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
      this.toast.show('Membresía asignada correctamente', 'success');
    } catch (error: any) {
      console.error('Error al asignar membresía:', error);
      this.toast.show('No se pudo asignar la membresía', 'error');
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
      this.toast.show('Membresía removida', 'success');
    } catch (error: any) {
      this.toast.show('Error al remover membresía', 'error');
    } finally {
      this.loading.set(false);
    }
  }
}
