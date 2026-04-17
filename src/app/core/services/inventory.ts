import { Injectable, inject } from '@angular/core';
import { Firestore, collection, query, where, collectionData } from '@angular/fire/firestore';
import { Observable, switchMap, of, map } from 'rxjs';
import { InventoryItem } from '../models';
import { AuthService } from './auth';
import { toSignal } from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);

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
}
