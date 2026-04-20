import { Component, inject, signal, ChangeDetectionStrategy, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { Timestamp } from '@angular/fire/firestore';
import { ServicePackages } from '../../../core/services/service-package';
import { Customers } from '../../../core/services/customer';
import { Memberships } from '../../../core/services/membership';
import { Orders } from '../../../core/services/order';
import { BranchState } from '../../../core/services/branch.state';
import { ServicePackage, Customer, Membership } from '../../../core/models';

import { CurrencyPipe, CommonModule } from '@angular/common';
import { rxResource } from '@angular/core/rxjs-interop';
import { AppPaginator } from '../../../shared/components/paginator/paginator';
import { Pricing } from '../../../core/services/pricing';


@Component({
  selector: 'app-order-new',
  imports: [RouterLink, CurrencyPipe, CommonModule, AppPaginator],
  templateUrl: './order-new.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrderNew {
  private router = inject(Router);
  private orderService = inject(Orders);
  public branchService = inject(BranchState);
  private packageService = inject(ServicePackages);
  private customerService = inject(Customers);
  private membershipService = inject(Memberships);
  private pricing = inject(Pricing);


  /** Catálogo de datos reactivos */
  packages = toSignal(this.packageService.getPackages(), { initialValue: [] as ServicePackage[] });
  memberships = toSignal(this.membershipService.getMemberships(), { initialValue: [] as Membership[] });

  /** Guardia de acción reactiva */
  hasActiveBranch = computed(() => !!this.branchService.activeBranchId());


  /** Estado del buscador y paginación */
  searchTerm = signal('');
  currentPage = signal(1);
  pageSize = 5;

  /** 
   * Índice de búsqueda híbrida (ARCH-EDO-1: Carga única reactiva)
   * Cargamos los nombres y IDs una sola vez para búsqueda substring instantánea.
   */
  customersResource = rxResource({
    stream: () => this.customerService.getSearchIndex()
  });

  /** 
   * Búsqueda por cualquier coincidencia y case-insensitive (PEDIDO-USUARIO)
   * Filtramos en memoria para latencia cero.
   */
  filteredCustomers = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const all = this.customersResource.value() ?? [];
    
    if (!term) return all;

    return all.filter(c => 
      c.name.toLowerCase().includes(term) || 
      (c.activePlate && c.activePlate.toLowerCase().includes(term))
    );
  });

  /** Paginación local sobre los resultados filtrados */
  customers = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredCustomers().slice(start, start + this.pageSize);
  });

  totalCustomers = computed(() => this.filteredCustomers().length);

  /** Estado del formulario */
  vehiclePlate = signal('');
  selectedPackage = signal<ServicePackage | null>(null);
  selectedCustomer = signal<Customer | null>(null);
  
  /** 
   * Cálculo reactivo via PricingEngine (SOLID)
   * Se dispara automáticamente cuando cambia el paquete, el cliente o se cargan las membresías.
   */
  pricingResult = computed(() => {
    const pkg = this.selectedPackage();
    const customer = this.selectedCustomer();
    const allMemberships = this.memberships();
    
    if (!pkg) return null;

    const membership = customer?.membershipId 
      ? allMemberships.find(m => m.id === customer.membershipId) 
      : null;

    return this.pricing.calculate(
      pkg.price,
      membership?.type,
      null, // TODO: Soporte para cupones en UI en siguiente etapa
      customer?.id
    );
  });

  finalPrice = computed(() => this.pricingResult()?.finalPrice ?? 0);

  scheduledDate = signal('');
  scheduledTime = signal('');

  isSubmitting = signal(false);
  errorMessage = signal('');

  selectPackage(pkg: ServicePackage) {
    this.selectedPackage.set(pkg);
  }


  onSearch(term: string) {
    this.searchTerm.set(term);
    this.currentPage.set(1);
  }

  selectCustomer(customer: Customer) {
    this.selectedCustomer.set(customer);
    this.vehiclePlate.set(customer.activePlate || '');
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
        finalPrice: pkg.price, // Enviamos el precio base, el servicio calculará el final con seguridad
        earnedPoints: pkg.pointsValue,
        status: 'AGENDADO',
        scheduledAt
      });

      this.router.navigate(['/app/agenda']);
    } catch (err: any) {
      // Captura de errores atómicos (Invariante FIRE-ERROR)
      this.errorMessage.set(err?.message || 'Error al crear la orden. Verificá los datos.');
      console.error('Error creando orden:', err);
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
