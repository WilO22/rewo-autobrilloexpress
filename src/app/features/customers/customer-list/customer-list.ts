import { Component, inject, signal, ChangeDetectionStrategy, computed, PLATFORM_ID } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe, isPlatformServer } from '@angular/common';
import { toSignal, rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { Customers } from '../../../core/services/customer';
import { Customer } from '../../../core/models';
import { AppPaginator } from '../../../shared/components/paginator/paginator';

@Component({
  selector: 'app-customer-list',
  imports: [RouterLink, DecimalPipe, AppPaginator],
  templateUrl: './customer-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomerList {
  private customerService = inject(Customers);
  private platformId = inject(PLATFORM_ID);

  searchTerm = signal('');
  currentPage = signal(1);
  pageSize = 20;

  /** 
   * Índice de búsqueda híbrida (ARCH-EDO-1: Carga única reactiva)
   */
  customersResource = rxResource({
    // ARCH-SENIOR: No ejecutamos consultas pesadas de Firestore en SSR
    // para evitar Permission Denied por falta de token en el servidor.
    stream: () => isPlatformServer(this.platformId) 
      ? of([]) 
      : this.customerService.getSearchIndex()
  });

  /** 
   * Búsqueda inteligente por cualquier coincidencia y case-insensitive (PEDIDO-USUARIO)
   */
  filteredCustomers = computed(() => {
    // ARCH-SAFE: Acceso seguro al valor para evitar que el resource sople un error en el template
    if (this.customersResource.error()) return [];
    
    const term = this.searchTerm().toLowerCase().trim();
    const all = this.customersResource.value() ?? [];
    
    if (!term) return all;

    return all.filter(c => 
      c.name.toLowerCase().includes(term) || 
      (c.activePlate && c.activePlate.toLowerCase().includes(term))
    );
  });

  /** Paginación local sobre resultados filtrados */
  customers = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredCustomers().slice(start, start + this.pageSize);
  });

  totalCustomers = computed(() => this.filteredCustomers().length);

  onSearch(term: string) {
    this.searchTerm.set(term);
    this.currentPage.set(1);
  }

  /** Determina si el cliente es VIB (>= 1000 puntos) */
  isVib(customer: Customer): boolean {
    return customer.points >= 1000;
  }

  /** Extrae las iniciales del nombre para el avatar */
  getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }
}
