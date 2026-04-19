import { Component, inject, computed, ChangeDetectionStrategy, signal, linkedSignal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { Branches } from '../../../core/services/branch';
import { Orders } from '../../../core/services/order';
import { ServicePackages } from '../../../core/services/service-package';
import { Toasts } from '../../../core/services/ui/toast';
import { Order, ServicePackage } from '../../../core/models';
import { of } from 'rxjs';

@Component({
  selector: 'app-order-board',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './order-board.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrderBoard {
  public branchService = inject(Branches);
  private orderService = inject(Orders);
  private packageService = inject(ServicePackages);
  private toastService = inject(Toasts);

  /** IDs de órdenes en proceso de transacción (Se resetea automáticamente al cambiar de sede) */
  processingIds = linkedSignal<string | null, Set<string>>({
    source: () => this.branchService.activeBranchId(),
    computation: () => new Set()
  });

  /** Catálogo de servicios (Modernizado con rxResource) */
  private packagesResource = rxResource<ServicePackage[], void>({
    stream: () => this.packageService.getPackages()
  });

  // Computed seguro: Si hay error o está cargando, devuelve array vacío para evitar crashes
  packages = computed<ServicePackage[]>(() => {
    if (this.packagesResource.error()) {
      console.warn('[OrderBoard] Error loading packages catálogo:', this.packagesResource.error());
      return [];
    }
    return this.packagesResource.value() ?? [];
  });

  /** Órdenes reactivas (Modernizado con rxResource para Angular 21 Elite) */
  private ordersResource = rxResource<Order[], string | null>({
    params: () => this.branchService.activeBranchId(),
    stream: ({ params: branchId }) =>
      branchId ? this.orderService.getOrdersByBranch(branchId) : of([])
  });

  orders = computed<Order[]>(() => this.ordersResource.value() ?? []);
  isLoading = computed(() => this.ordersResource.isLoading());

  /** Derivados por estado para el pipeline visual */
  agendados = computed(() => this.orders().filter(o => o.status === 'AGENDADO'));
  enProceso = computed(() => this.orders().filter(o => o.status === 'EN_PROCESO'));
  completados = computed(() => this.orders().filter(o => o.status === 'COMPLETADO'));

  /** Nombre de la sede activa (Computado desde el catálogo) */
  branchName = computed(() => {
    const id = this.branchService.activeBranchId();
    if (!id) return 'Ninguna';
    
    // Buscamos en el catálogo de sedes del servicio
    // Nota: El servicio de sedes carga su lista vía rxResource internamente
    const branch = this.branchService.branches().find(b => b.id === id);
    return branch ? branch.name : 'Cargando...';
  });

  /**
   * ESTADO 1 -> 2: Iniciar Lavado (Descuenta stock)
   */
  async onStartProcessing(order: Order) {
    const pkg = this.packages().find(p => p.id === order.serviceId);
    if (!pkg) {
      this.toastService.error('Error: Paquete de servicio no encontrado.');
      return;
    }

    this.toggleLoading(order.id, true);
    try {
      await this.orderService.startProcessing(order.id, pkg);
      this.toastService.success(`Lavado iniciado para: ${order.vehiclePlate}`);
    } catch (err: any) {
      this.toastService.error(err.message || 'Error al iniciar el proceso.');
    } finally {
      this.toggleLoading(order.id, false);
    }
  }

  /**
   * ESTADO 2 -> 3: Marcar Completado (Suma puntos)
   */
  async onCompleteOrder(order: Order) {
    const pkg = this.packages().find(p => p.id === order.serviceId);
    const points = pkg?.pointsValue || 0;

    this.toggleLoading(order.id, true);
    try {
      await this.orderService.completeOrder(order.id, order.customerId, points);
      this.toastService.success(`Orden ${order.vehiclePlate} completada. +${points} puntos.`);
    } catch (err: any) {
      this.toastService.error('Error al finalizar la orden.');
    } finally {
      this.toggleLoading(order.id, false);
    }
  }

  /** Helper para lookup de nombres en el template */
  getServiceName(id: string): string {
    return this.packages().find(p => p.id === id)?.name ?? id;
  }

  private toggleLoading(id: string, isLoading: boolean) {
    this.processingIds.update(set => {
      const newSet = new Set(set);
      isLoading ? newSet.add(id) : newSet.delete(id);
      return newSet;
    });
  }
}
