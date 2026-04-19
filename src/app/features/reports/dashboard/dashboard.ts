import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Reports } from '../../../core/services/report';
import { Inventory } from '../../../core/services/inventory';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, CurrencyPipe],
  templateUrl: './dashboard.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Dashboard {
  public reportService = inject(Reports);
  private inventoryService = inject(Inventory);

  /** Signal con los KPIs calculados */
  kpis = this.reportService.globalKpis;

  /** Detección de Stock Crítico (Fase 4 - SOLID) */
  criticalItems = toSignal(
    this.inventoryService.getGlobalInventoryItems().pipe(
      map(items => items.filter(i => i.stock <= i.minStock))
    ),
    { initialValue: [] }
  );

  /** Formateador para el progreso visual (max 100) */
  getPercentage(revenue: number): number {
    const total = this.kpis().totalRevenue;
    return total > 0 ? (revenue / total) * 100 : 0;
  }
}
