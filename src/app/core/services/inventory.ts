import { Injectable, inject } from '@angular/core';
import { 
  Firestore, collection, query, where, collectionData, 
  addDoc, deleteDoc, doc, updateDoc, runTransaction, serverTimestamp 
} from '@angular/fire/firestore';
import { Observable, switchMap, of, map } from 'rxjs';
import { InventoryItem, InventoryMovement } from '../models';
import { Identity } from './auth';

@Injectable()
export class Inventory {
  private firestore = inject(Firestore);
  private authService = inject(Identity);

  /** 
   * Stream reactivo del inventario filtrado por la sede del usuario logueado.
   */
  getInventoryItems() {
    return this.authService.profile$.pipe(
      switchMap(profile => {
        if (!profile?.branchId) return of([]);
        const ref = collection(this.firestore, 'inventory');
        const q = query(ref, where('branchId', '==', profile.branchId));
        return collectionData(q, { idField: 'id' }).pipe(
          map(items => items as InventoryItem[])
        );
      })
    );
  }

  /**
   * Stream reactivo de TODO el inventario del sistema.
   */
  getGlobalInventoryItems(): Observable<InventoryItem[]> {
    const ref = collection(this.firestore, 'inventory');
    return collectionData(ref, { idField: 'id' }).pipe(
      map(items => items as InventoryItem[])
    );
  }

  /**
   * Stream reactivo de ítems de una sucursal específica.
   */
  getInventoryItemsByBranch(branchId: string): Observable<InventoryItem[]> {
    const ref = collection(this.firestore, 'inventory');
    const q = query(ref, where('branchId', '==', branchId));
    return collectionData(q, { idField: 'id' }).pipe(
      map(items => items as InventoryItem[])
    );
  }

  /**
   * Consulta el historial de movimientos (Kardex) de una sucursal.
   * Invariante SPEC-FIRST Sección 4 (Kardex).
   */
  getMovementsByBranch(branchId: string): Observable<InventoryMovement[]> {
    const ref = collection(this.firestore, 'inventory_movements');
    const q = query(ref, where('branchId', '==', branchId));
    
    return collectionData(q, { idField: 'id' }).pipe(
      map(items => items as InventoryMovement[]),
      map(items => items.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis()))
    );
  }

  /**
   * Agrega un nuevo producto al inventario.
   * Si tiene stock inicial, registra el movimiento de entrada para auditoría.
   */
  async addItem(item: Omit<InventoryItem, 'id'>) {
    const userId = this.authService.user()?.uid || 'system';
    const inventoryRef = collection(this.firestore, 'inventory');
    const movementRef = collection(this.firestore, 'inventory_movements');

    return runTransaction(this.firestore, async (transaction) => {
      // 1. Crear el ítem
      const newItemRef = doc(inventoryRef);
      const dataWithId = { ...item, createdAt: serverTimestamp() };
      transaction.set(newItemRef, dataWithId);

      // 2. Si hay stock inicial, registrar entrada inicial
      if (item.stock > 0) {
        const firstMovementRef = doc(movementRef);
        transaction.set(firstMovementRef, {
          itemId: newItemRef.id,
          branchId: item.branchId,
          type: 'IN',
          quantity: item.stock,
          reason: 'CARGA INICIAL DE INVENTARIO',
          createdAt: serverTimestamp(),
          createdBy: userId
        });
      }

      return newItemRef.id;
    });
  }

  async deleteItem(id: string) {
    const ref = doc(this.firestore, `inventory/${id}`);
    return deleteDoc(ref);
  }

  async updateItem(id: string, data: Partial<InventoryItem>) {
    const ref = doc(this.firestore, `inventory/${id}`);
    return updateDoc(ref, data);
  }

  /**
   * Registra un ajuste manual de stock (IN/OUT) con auditoría obligatoria.
   * Invariante SPEC-FIRST Sección 3 & Recommendation Senior SRP.
   */
  async registerAdjustment(itemId: string, branchId: string, quantity: number, type: 'IN' | 'OUT', reason: string) {
    const itemRef = doc(this.firestore, `inventory/${itemId}`);
    const userId = this.authService.user()?.uid || 'system';

    return runTransaction(this.firestore, async (transaction) => {
      const itemSnap = await transaction.get(itemRef);
      if (!itemSnap.exists()) throw new Error('El item no existe.');

      const absQty = Math.abs(quantity); // Fuerza valor absoluto para integridad
      const currentStock = itemSnap.data()?.['stock'] || 0;
      const newStock = type === 'IN' ? currentStock + absQty : currentStock - absQty;

      if (newStock < 0) throw new Error('El ajuste sobrepasa el stock disponible.');

      // 1. Actualizar Stock
      transaction.update(itemRef, {
        stock: newStock,
        updatedAt: serverTimestamp()
      });

      // 2. Registrar Movimiento (Kardex IN/OUT manual)
      const movementRef = doc(collection(this.firestore, 'inventory_movements'));
      transaction.set(movementRef, {
        itemId,
        branchId,
        type,
        quantity: absQty,
        reason,
        createdAt: serverTimestamp(),
        createdBy: userId
      });
    });
  }
}
