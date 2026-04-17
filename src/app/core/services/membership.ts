import { Injectable, inject } from '@angular/core';
import { 
  Firestore, collection, query, orderBy, 
  doc, docData, collectionData 
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Membership } from '../models';

@Injectable({
  providedIn: 'root'
})
export class MembershipService {
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
}
