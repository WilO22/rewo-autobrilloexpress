import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { InventoryService } from '../../core/services/inventory';

@Component({
  selector: 'app-inventory-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inventory-list.html',
})
export class InventoryList {
  private inventoryService = inject(InventoryService);

  /** Signal del inventario filtrado */
  items = toSignal(this.inventoryService.getInventoryItems(), { initialValue: [] });

  /**
   * Determina si un item está en nivel crítico de stock.
   */
  isLowStock(stock: number, minStock: number): boolean {
    return stock <= minStock;
  }

  /**
   * Retorna una clase de color según el nivel de stock.
   */
  getStatusClass(stock: number, minStock: number): string {
    if (stock <= 0) return 'text-rose-500 bg-rose-500/10 border-rose-500/30';
    if (stock <= minStock) return 'text-amber-500 bg-amber-500/10 border-amber-500/30';
    return 'text-cian bg-cian/10 border-cian/30';
  }
}
