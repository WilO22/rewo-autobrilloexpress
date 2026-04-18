import { Injectable, inject } from '@angular/core';
import { Firestore, collection, query, where, collectionData, addDoc, deleteDoc, doc, updateDoc } from '@angular/fire/firestore';
import { Observable, switchMap, of, map } from 'rxjs';
import { InventoryItem } from '../models';
import { Identity } from './auth';

@Injectable({
  providedIn: 'root'
})
export class Inventory {
  private firestore = inject(Firestore);
  private authService = inject(Identity);

  /** 
   * Stream reactivo del inventario filtrado por la sede del usuario logueado.
   * Ideal para el Manager de sucursal.
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
   * Exclusivo para el Super Admin.
   */
  getGlobalInventoryItems(): Observable<InventoryItem[]> {
    const ref = collection(this.firestore, 'inventory');
    return collectionData(ref, { idField: 'id' }).pipe(
      map(items => items as InventoryItem[])
    );
  }

  /**
   * Stream reactivo de ítems de una sucursal específica (Útil para CEO filtrando).
   */
  getInventoryItemsByBranch(branchId: string): Observable<InventoryItem[]> {
    const ref = collection(this.firestore, 'inventory');
    const q = query(ref, where('branchId', '==', branchId));
    
    return collectionData(q, { idField: 'id' }).pipe(
      map(items => items as InventoryItem[])
    );
  }

  /**
   * Registra un nuevo ítem de inventario.
   */
  async addItem(item: Omit<InventoryItem, 'id'>) {
    const ref = collection(this.firestore, 'inventory');
    return addDoc(ref, item);
  }

  /**
   * Elimina un ítem de inventario por ID.
   */
  async deleteItem(id: string) {
    const ref = doc(this.firestore, `inventory/${id}`);
    return deleteDoc(ref);
  }

  /**
   * Actualiza los datos de un ítem existente.
   */
  async updateItem(id: string, data: Partial<InventoryItem>) {
    const ref = doc(this.firestore, `inventory/${id}`);
    return updateDoc(ref, data);
  }
}
