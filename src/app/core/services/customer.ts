import { Injectable, inject, signal } from '@angular/core';
import {
  Firestore, collection, query, where, orderBy, limit,
  doc, addDoc, updateDoc, serverTimestamp
} from '@angular/fire/firestore';
import { collectionData, docData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Customer } from '../models';

@Injectable({
  providedIn: 'root'
})
export class Customers {
  private firestore = inject(Firestore);

  /** Lista paginada de clientes (ARCH-FIREBASE regla 5: limit por defecto) */
  getCustomers(maxResults = 20): Observable<Customer[]> {
    const ref = collection(this.firestore, 'customers');
    const q = query(ref, orderBy('name'), limit(maxResults));
    return collectionData(q, { idField: 'id' }) as Observable<Customer[]>;
  }

  /** Detalle de un cliente por ID */
  getCustomer(id: string): Observable<Customer | undefined> {
    const ref = doc(this.firestore, `customers/${id}`);
    return docData(ref, { idField: 'id' }) as Observable<Customer | undefined>;
  }

  /** Crear un cliente nuevo */
  async createCustomer(data: Omit<Customer, 'id'>) {
    const ref = collection(this.firestore, 'customers');
    return addDoc(ref, {
      ...data,
      createdAt: serverTimestamp()
    });
  }

  /** Actualizar campos parciales (ARCH-FIREBASE regla 2: updateDoc > setDoc) */
  async updateCustomer(id: string, data: Partial<Customer>) {
    const ref = doc(this.firestore, `customers/${id}`);
    return updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
  }
}
