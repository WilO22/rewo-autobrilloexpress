import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { Timestamp } from 'firebase/firestore';
import { ServicePackageService } from '../../../core/services/service-package';
import { OrderService } from '../../../core/services/order';
import { BranchService } from '../../../core/services/branch';
import { ServicePackage } from '../../../core/models';

@Component({
  selector: 'app-order-new',
  imports: [RouterLink],
  templateUrl: './order-new.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrderNew {
  private router = inject(Router);
  private orderService = inject(OrderService);
  private branchService = inject(BranchService);
  private packageService = inject(ServicePackageService);

  /** Catálogo de paquetes desde Firestore */
  packages = toSignal(this.packageService.getPackages(), { initialValue: [] as ServicePackage[] });

  /** Estado del formulario */
  vehiclePlate = signal('');
  selectedPackage = signal<ServicePackage | null>(null);
  scheduledDate = signal('');
  scheduledTime = signal('');
  isSubmitting = signal(false);
  errorMessage = signal('');

  selectPackage(pkg: ServicePackage) {
    this.selectedPackage.set(pkg);
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
      const scheduledAt = Timestamp.fromDate(
        new Date(`${date}T${time || '00:00'}`)
      );

      await this.orderService.createOrder({
        branchId,
        customerId: '',
        vehiclePlate: plate,
        serviceId: pkg.id,
        couponId: null,
        finalPrice: pkg.price,
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
