import { Injectable, inject } from '@angular/core';
import { 
  Firestore, collection, query, orderBy, 
  doc, docData, collectionData, addDoc, updateDoc, deleteDoc 
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Membership } from '../models';

@Injectable({
  providedIn: 'root'
})
export class Memberships {
  private firestore = inject(Firestore);

  /**
   * Obtiene el catálogo completo de membresías.
   */
  getMemberships(): Observable<Membership[]> {
    const ref = collection(this.firestore, 'memberships');
    const q = query(ref, orderBy('name'));
    return collectionData(q, { idField: 'id' }) as Observable<Membership[]>;
  }

  /**
   * Obtiene el detalle de una membresía específica.
   */
  getMembership(id: string): Observable<Membership | undefined> {
    const ref = doc(this.firestore, `memberships/${id}`);
    return docData(ref, { idField: 'id' }) as Observable<Membership | undefined>;
  }

  /**
   * Crea una nueva membresía.
   */
  async addMembership(membership: Omit<Membership, 'id'>) {
    const ref = collection(this.firestore, 'memberships');
    return addDoc(ref, membership);
  }

  /**
   * Actualiza una membresía existente.
   */
  async updateMembership(id: string, membership: Partial<Membership>) {
    const ref = doc(this.firestore, `memberships/${id}`);
    return updateDoc(ref, membership);
  }

  /**
   * Elimina una membresía.
   */
  async deleteMembership(id: string) {
    const ref = doc(this.firestore, `memberships/${id}`);
    return deleteDoc(ref);
  }
}
