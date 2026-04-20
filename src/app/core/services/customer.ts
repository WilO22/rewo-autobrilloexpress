import { Injectable, inject, signal } from '@angular/core';
import {
  Firestore, collection, query, where, orderBy, limit,
  doc, addDoc, updateDoc, serverTimestamp, startAfter, getCountFromServer, QueryConstraint
} from '@angular/fire/firestore';
import { collectionData, docData } from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';
import { Customer } from '../models';

export interface PaginatedCustomers {
  items: Customer[];
  total: number;
}

@Injectable()
export class Customers {
  private firestore = inject(Firestore);

  /** 
   * Búsqueda paginada (ARCH-FIREBASE regla 5: limit por defecto)
   * Soporta búsqueda por nombre o placa y paginación por cursor.
   */
  getPaginated(term: string = '', pageSize: number = 5, lastVisible: any = null): Observable<Customer[]> {
    const ref = collection(this.firestore, 'customers');
    const constraints: QueryConstraint[] = [orderBy('name'), limit(pageSize)];
    
    if (term) {
      // Búsqueda simple por prefijo (Firestore limitation: use text index or simple range)
      constraints.push(where('name', '>=', term));
      constraints.push(where('name', '<=', term + '\uf8ff'));
    }

    if (lastVisible) {
      constraints.push(startAfter(lastVisible));
    }

    const q = query(ref, ...constraints);
    return collectionData(q, { idField: 'id' }) as Observable<Customer[]>;
  }

  /** Obtener el total de clientes para el indicador de paginación */
  count(): Observable<number> {
    const ref = collection(this.firestore, 'customers');
    return from(getCountFromServer(ref).then(snap => snap.data().count));
  }

  /** 
   * Retorna un índice liviano de todos los clientes para búsqueda híbrida.
   * Optimizado para búsqueda por cualquier caracter (substring) y case-insensitive en el cliente.
   */
  getSearchIndex(): Observable<Customer[]> {
    const ref = collection(this.firestore, 'customers');
    const q = query(ref, orderBy('name'));
    // ARCH-SOLID: Devolvemos todo el objeto pero solo usaremos campos clave en el componente para ahorrar memoria
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
