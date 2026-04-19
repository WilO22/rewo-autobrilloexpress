import { Injectable, inject } from '@angular/core';
import { 
  Firestore, collection, query, where, collectionData, 
  addDoc, deleteDoc, doc, updateDoc 
} from '@angular/fire/firestore';
import { Observable, switchMap, of, map } from 'rxjs';
import { InventoryItem, InventoryMovement } from '../models';
import { Identity } from './auth';

@Injectable({
  providedIn: 'root'
})
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

  async addItem(item: Omit<InventoryItem, 'id'>) {
    const ref = collection(this.firestore, 'inventory');
    return addDoc(ref, item);
  }

  async deleteItem(id: string) {
    const ref = doc(this.firestore, `inventory/${id}`);
    return deleteDoc(ref);
  }

  async updateItem(id: string, data: Partial<InventoryItem>) {
    const ref = doc(this.firestore, `inventory/${id}`);
    return updateDoc(ref, data);
  }
}
