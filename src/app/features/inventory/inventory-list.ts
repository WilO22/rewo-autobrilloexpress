import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { effect } from '@angular/core';
import { switchMap } from 'rxjs';
import { Inventory } from '../../core/services/inventory';
import { Identity } from '../../core/services/auth';
import { Branches } from '../../core/services/branch';
import { Toasts } from '../../core/services/ui/toast';
import { InventoryItem } from '../../core/models';
import { AppPaginator } from '../../shared/components/paginator/paginator';
import { ConfirmModal } from '../../shared/components/confirm-modal/confirm-modal';
import { Spinner } from '../../shared/components/spinner/spinner';

@Component({
  selector: 'app-inventory-list',
  imports: [CommonModule, FormsModule, AppPaginator, ConfirmModal, Spinner],
  templateUrl: './inventory-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InventoryList {
  public inventoryService = inject(Inventory);
  public authService = inject(Identity);
  public branchService = inject(Branches);
  private toastService = inject(Toasts);

  // --- State Signals ---
  public isLoading = signal(false);
  protected Math = Math;
  
  // --- ESTADO REACTIVO (UI) ---
  searchTerm = signal('');
  statusFilter = signal<'all' | 'low' | 'out'>('all');
  
  // Paginación
  currentPage = signal(1);
  pageSize = signal(8);

  // Estado del Modal de Formulario
  isModalOpen = signal(false);
  isEditing = signal(false);
  editingId = signal<string | null>(null);

  // Estado del Modal de Confirmación
  isConfirmDialogOpen = signal(false);
  itemToDelete = signal<string | null>(null);

  // Registro de efectos reactivos (UX Smart)
  private _resetPage = effect(() => {
    this.searchTerm();
    this.statusFilter();
    this.currentPage.set(1);
  });
  
  // Objeto base para nuevos productos
  private readonly defaultItem: Partial<InventoryItem> = {
    name: '',
    stock: 0,
    minStock: 2,
    unit: 'unidad',
    branchId: ''
  };

  newItem = signal<Partial<InventoryItem>>({ ...this.defaultItem });

  /**
   * Signal del inventario reactivo: 
   * Escucha cambios en branchService.activeBranchId y refresca la lista.
   */
  items = toSignal(
    toObservable(this.branchService.activeBranchId).pipe(
      switchMap(branchId => {
        // Lógica para Super Admin
        if (this.authService.userRole() === 'SUPER_ADMIN') {
          return branchId 
            ? this.inventoryService.getInventoryItemsByBranch(branchId)
            : this.inventoryService.getGlobalInventoryItems();
        }
        
        // Lógica para Manager de sucursal
        return this.inventoryService.getInventoryItems();
      })
    ),
    { initialValue: [] }
  );

  /**
   * KPIs Computados (Analítica Instantánea)
   */
  totalItems = computed(() => this.items().length);
  lowStockCount = computed(() => this.items().filter(i => i.stock > 0 && i.stock <= i.minStock).length);
  outOfStockCount = computed(() => this.items().filter(i => i.stock <= 0).length);

  /**
   * Lista Filtrada (Búsqueda + Estado)
   * Latencia cero para el CEO.
   */
  filteredItems = computed(() => {
    let list = this.items();
    const term = this.searchTerm().toLowerCase().trim();
    const filter = this.statusFilter();

    // Filtro por término
    if (term) {
      list = list.filter(i => 
        i.name.toLowerCase().includes(term) || 
        this.getBranchName(i.branchId).toLowerCase().includes(term)
      );
    }

    // Filtro por estado
    if (filter === 'low') {
      list = list.filter(i => i.stock > 0 && i.stock <= i.minStock);
    } else if (filter === 'out') {
      list = list.filter(i => i.stock <= 0);
    }

    return list;
  });

  /**
   * Sección Paginada (Latencia Cero)
   * Solo renderizamos lo que el usuario ve, manteniendo el resto en memoria reactiva.
   */
  pagedItems = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredItems().slice(start, start + this.pageSize());
  });

  /**
   * Obtiene el nombre de la sede por ID para la vista global.
   */
  getBranchName(id: string | null): string {
    if (!id) return 'Global';
    const branches = this.branchService.branches();
    return branches.find(b => b.id === id)?.name || 'Sede Desconocida';
  }

  /**
   * Retorna una clase de color según el nivel de stock.
   */
  getStatusClass(stock: number, minStock: number): string {
    if (stock <= 0) return 'text-rose-500 bg-rose-500/10 border-rose-500/30';
    if (stock <= minStock) return 'text-amber-500 bg-amber-500/10 border-amber-500/30';
    return 'text-cian bg-cian/10 border-cian/30';
  }

  // --- ACCIONES ADMINISTRATIVAS (CEO ONLY) ---

  openModal(item?: InventoryItem) {
    if (item) {
      this.isEditing.set(true);
      this.editingId.set(item.id);
      this.newItem.set({ ...item });
    } else {
      this.isEditing.set(false);
      this.editingId.set(null);
      const firstBranchId = this.branchService.branches()[0]?.id || '';
      this.newItem.set({ ...this.defaultItem, branchId: firstBranchId });
    }
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  async saveItem() {
    const data = this.newItem();
    if (!data.name || !data.branchId) {
      this.toastService.error('Por favor, completa los campos obligatorios.');
      return;
    }

    this.isLoading.set(true);
    try {
      if (this.isEditing() && this.editingId()) {
        await this.inventoryService.updateItem(this.editingId()!, data);
        this.toastService.success('Producto actualizado exitosamente.');
      } else {
        await this.inventoryService.addItem(data as Omit<InventoryItem, 'id'>);
        this.toastService.success('Producto creado exitosamente.');
      }
      this.closeModal();
    } catch (error) {
      this.toastService.error('Error al procesar la solicitud.');
      console.error('Error saving item:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  // --- Lógica de Eliminación ---

  requestDelete(id: string) {
    this.itemToDelete.set(id);
    this.isConfirmDialogOpen.set(true);
  }

  cancelDelete() {
    this.isConfirmDialogOpen.set(false);
    this.itemToDelete.set(null);
  }

  async confirmDelete() {
    const id = this.itemToDelete();
    if (!id) return;

    this.isLoading.set(true);
    try {
      await this.inventoryService.deleteItem(id);
      this.toastService.success('Producto eliminado correctamente.');
      this.cancelDelete();
    } catch (error) {
      this.toastService.error('Error al eliminar el producto.');
      console.error('Error deleting item:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  // --- AJUSTE RÁPIDO (SIN MODALES) ---

  async quickAdjust(item: InventoryItem, delta: number) {
    const newStock = Math.max(0, item.stock + delta);
    if (newStock === item.stock) return;

    this.isLoading.set(true);
    try {
      await this.inventoryService.updateItem(item.id, { stock: newStock });
    } catch (error) {
      this.toastService.error('Error al ajustar stock.');
      console.error('Quick adjust error:', error);
    } finally {
      this.isLoading.set(false);
    }
  }
}
