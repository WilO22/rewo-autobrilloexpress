import { Component, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { BranchService } from '../../../core/services/branch';
import { OrderService } from '../../../core/services/order';
import { Order } from '../../../core/models';
import { switchMap, of } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-order-board',
  imports: [RouterLink],
  templateUrl: './order-board.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrderBoard {
  private branchService = inject(BranchService);
  private orderService = inject(OrderService);

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
}
