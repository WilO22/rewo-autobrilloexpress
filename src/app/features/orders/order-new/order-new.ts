import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { Timestamp } from '@angular/fire/firestore';
import { ServicePackages } from '../../../core/services/service-package';
import { Customers } from '../../../core/services/customer';
import { Memberships } from '../../../core/services/membership';
import { Orders } from '../../../core/services/order';
import { Branches } from '../../../core/services/branch';
import { ServicePackage, Customer, Membership } from '../../../core/models';

import { CurrencyPipe, CommonModule } from '@angular/common';

@Component({
  selector: 'app-order-new',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, CommonModule],
  templateUrl: './order-new.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrderNew {
  private router = inject(Router);
  private orderService = inject(Orders);
  private branchService = inject(Branches);
  private packageService = inject(ServicePackages);
  private customerService = inject(Customers);
  private membershipService = inject(Memberships);

  /** Catálogo de datos reactivos */
  packages = toSignal(this.packageService.getPackages(), { initialValue: [] as ServicePackage[] });
  customers = toSignal(this.customerService.getCustomers(100), { initialValue: [] as Customer[] });
  memberships = toSignal(this.membershipService.getMemberships(), { initialValue: [] as Membership[] });

  /** Estado del formulario */
  vehiclePlate = signal('');
  selectedPackage = signal<ServicePackage | null>(null);
  selectedCustomer = signal<Customer | null>(null);
  finalPrice = signal(0);
  scheduledDate = signal('');
  scheduledTime = signal('');
  isSubmitting = signal(false);
  errorMessage = signal('');

  selectPackage(pkg: ServicePackage) {
    this.selectedPackage.set(pkg);
    this.calculateFinalPrice();
  }

  selectCustomer(customer: Customer) {
    this.selectedCustomer.set(customer);
    this.vehiclePlate.set(customer.activePlate || '');
    this.calculateFinalPrice();
  }

  /**
   * Lógica crítica: Precio 0 si el cliente tiene membresía ILIMITADA.
   * Basado en directiva de Gemini 3.1 Pro aceptada por usuario.
   */
  private calculateFinalPrice() {
    const pkg = this.selectedPackage();
    const customer = this.selectedCustomer();
    
    if (!pkg) {
      this.finalPrice.set(0);
      return;
    }

    if (customer?.membershipId) {
      const membership = this.memberships().find(m => m.id === customer.membershipId);
      if (membership?.type === 'ILIMITADO') {
        this.finalPrice.set(0);
        return;
      }
    }

    this.finalPrice.set(pkg.price);
  }

  async submitOrder() {
    const plate = this.vehiclePlate().trim().toUpperCase();
    const pkg = this.selectedPackage();
    const date = this.scheduledDate();
    const time = this.scheduledTime();
    const branchId = this.branchService.activeBranchId();

    // Validaciones
    if (!plate) { this.errorMessage.set('La placa del vehículo es obligatoria'); return; }
    if (!pkg) { this.errorMessage.set('Selecciona un paquete de servicio'); return; }
    if (!date) { this.errorMessage.set('La fecha es obligatoria'); return; }
    if (!branchId) { this.errorMessage.set('No hay una sede activa seleccionada'); return; }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    try {
      // Formateo robusto de fecha: evita problemas de zona horaria y formatos de browser
      const [year, month, day] = date.split('-').map(Number);
      const [hours, minutes] = (time || '00:00').split(':').map(Number);
      
      const d = new Date(year, month - 1, day, hours, minutes);
      const scheduledAt = Timestamp.fromDate(d);

      const customer = this.selectedCustomer();

      await this.orderService.createOrder({
        branchId,
        customerId: customer?.id || '',
        vehiclePlate: plate,
        serviceId: pkg.id,
        couponId: null,
        finalPrice: this.finalPrice(),
        earnedPoints: pkg.pointsValue,
        status: 'AGENDADO',
        scheduledAt
      });

      this.router.navigate(['/app/agenda']);
    } catch (err) {
      this.errorMessage.set('Error al crear la orden. Verificá los datos.');
      console.error('Error creando orden:', err);
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
