import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';
import { InventoryService } from '../../core/services/inventory';
import { AuthService } from '../../core/services/auth';
import { BranchService } from '../../core/services/branch';
import { ToastService } from '../../core/services/ui/toast';
import { InventoryItem } from '../../core/models';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal';

@Component({
  selector: 'app-inventory-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmModalComponent],
  templateUrl: './inventory-list.html',
})
export class InventoryList {
  public inventoryService = inject(InventoryService);
  public authService = inject(AuthService);
  public branchService = inject(BranchService);
  private toastService = inject(ToastService);

  // Estado del Modal de Formulario
  isModalOpen = signal(false);
  isEditing = signal(false);
  editingId = signal<string | null>(null);

  // Estado del Modal de Confirmación
  isConfirmDialogOpen = signal(false);
  itemToDelete = signal<string | null>(null);
  
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

    try {
      await this.inventoryService.deleteItem(id);
      this.toastService.success('Producto eliminado correctamente.');
      this.cancelDelete();
    } catch (error) {
      this.toastService.error('Error al eliminar el producto.');
      console.error('Error deleting item:', error);
    }
  }
}
