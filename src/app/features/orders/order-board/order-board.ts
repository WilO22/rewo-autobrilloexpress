import { Component, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { BranchService } from '../../../core/services/branch';
import { OrderService } from '../../../core/services/order';
import { ServicePackageService } from '../../../core/services/service-package';
import { ToastService } from '../../../core/services/ui/toast';
import { Order, ServicePackage } from '../../../core/models';
import { switchMap, of, firstValueFrom } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';
import { signal } from '@angular/core'; 

@Component({
  selector: 'app-order-board',
  imports: [RouterLink],
  templateUrl: './order-board.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrderBoard {
  private branchService = inject(BranchService);
  private orderService = inject(OrderService);
  private packageService = inject(ServicePackageService);
  private toast = inject(ToastService);

  /** IDs de órdenes en proceso de transacción (para loading UI) */
  processingIds = signal<Set<string>>(new Set());

  /** Catálogo de servicios para lookup de metadatos (puntos, stock) */
  packages = toSignal(this.packageService.getPackages(), { initialValue: [] as ServicePackage[] });

  /** Órdenes reactivas: cambian automáticamente con la sucursal activa */
  private orders$ = toObservable(this.branchService.activeBranchId).pipe(
    switchMap(branchId =>
      branchId ? this.orderService.getOrdersByBranch(branchId) : of([])
    )
  );

  orders = toSignal(this.orders$, { initialValue: [] as Order[] });

  /** Derivados por estado para el pipeline visual */
  agendados = computed(() => this.orders().filter(o => o.status === 'AGENDADO'));
  enProceso = computed(() => this.orders().filter(o => o.status === 'EN_PROCESO'));
  completados = computed(() => this.orders().filter(o => o.status === 'COMPLETADO'));

  branchName = computed(() => {
    const id = this.branchService.activeBranchId();
    const branch = this.branchService.branches().find(b => b.id === id);
    return branch?.name ?? 'Sin sede';
  });

  /**
   * ESTADO 1 -> 2: Iniciar Lavado (Descuenta stock)
   */
  async onStartProcessing(order: Order) {
    const pkg = this.packages().find(p => p.id === order.serviceId);
    if (!pkg) {
      this.toast.error('Error: Paquete de servicio no encontrado.');
      return;
    }

    this.toggleLoading(order.id, true);
    try {
      await this.orderService.startProcessing(order.id, pkg);
      this.toast.success(`Lavado iniciado para: ${order.vehiclePlate}`);
    } catch (err: any) {
      this.toast.error(err.message || 'Error al iniciar el proceso.');
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
      this.toast.success(`Orden ${order.vehiclePlate} completada. +${points} puntos.`);
    } catch (err: any) {
      this.toast.error('Error al finalizar la orden.');
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
