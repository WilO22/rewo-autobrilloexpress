import { Injectable, inject, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { OrderService } from './order';
import { BranchService } from './branch';
import { Order } from '../models';

export interface BranchPerformance {
  branchId: string;
  name: string;
  revenue: number;
  count: number;
}

export interface GlobalKPIs {
  totalRevenue: number;
  totalOrders: number;
  averageTicket: number;
  performanceByBranch: BranchPerformance[];
}

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private orderService = inject(OrderService);
  private branchService = inject(BranchService);

  /** Stream de todas las órdenes (limitado a 200 en el service para Spark Plan) */
  private allOrders = toSignal(this.orderService.getGlobalOrders(), { initialValue: [] as Order[] });

  /** KPIs calculados reactivamente mediante computeds */
  globalKpis = computed<GlobalKPIs>(() => {
    const orders = this.allOrders().filter(o => o.status === 'COMPLETADO');
    const branches = this.branchService.branches();

    const totalRevenue = orders.reduce((acc, o) => acc + (o.finalPrice || 0), 0);
    const totalOrders = orders.length;
    const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const performanceMap = new Map<string, { revenue: number, count: number }>();

    orders.forEach(o => {
      const stats = performanceMap.get(o.branchId) || { revenue: 0, count: 0 };
      stats.revenue += (o.finalPrice || 0);
      stats.count += 1;
      performanceMap.set(o.branchId, stats);
    });

    const performanceByBranch: BranchPerformance[] = branches.map(b => {
      const stats = performanceMap.get(b.id) || { revenue: 0, count: 0 };
      return {
        branchId: b.id,
        name: b.name,
        revenue: stats.revenue,
        count: stats.count
      };
    }).sort((a, b) => b.revenue - a.revenue);

    return {
      totalRevenue,
      totalOrders,
      averageTicket,
      performanceByBranch
    };
  });
}
