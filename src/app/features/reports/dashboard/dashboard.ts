import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Reports } from '../../../core/services/report';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  templateUrl: './dashboard.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Dashboard {
  public reportService = inject(Reports);

  /** Signal con los KPIs calculados */
  kpis = this.reportService.globalKpis;

  /** Formateador para el progreso visual (max 100) */
  getPercentage(revenue: number): number {
    const total = this.kpis().totalRevenue;
    return total > 0 ? (revenue / total) * 100 : 0;
  }
}
