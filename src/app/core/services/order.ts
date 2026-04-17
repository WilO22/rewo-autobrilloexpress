import { Injectable, inject } from '@angular/core';
import {
  Firestore, collection, query, where, limit,
  doc, addDoc, runTransaction, serverTimestamp
} from '@angular/fire/firestore';
import { collectionData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Order, OrderStatus, ServicePackage } from '../models';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private firestore = inject(Firestore);

  /** Órdenes del día por sucursal (ARCH-FIREBASE regla 5: limit) */
  getOrdersByBranch(branchId: string, maxResults = 50): Observable<Order[]> {
    const ref = collection(this.firestore, 'orders');
    const q = query(
      ref,
      where('branchId', '==', branchId),
      limit(maxResults)
    );
    return collectionData(q, { idField: 'id' }) as Observable<Order[]>;
  }

  /** Crear nueva orden/cita */
  async createOrder(data: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) {
    const ref = collection(this.firestore, 'orders');
    return addDoc(ref, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }

  /**
   * TRANSACCIÓN 1: Agendar → En Proceso → Descuenta Stock
   * Invariante SPEC-FIRST Sección 6: Transacción Atómica estricta
   */
  async startProcessing(orderId: string, servicePkg: ServicePackage) {
    const orderRef = doc(this.firestore, `orders/${orderId}`);

    await runTransaction(this.firestore, async (transaction) => {
      // 1. PRIMERO: Realizar todas las LECTURAS
      const inventoryReads = await Promise.all(
        servicePkg.requiredItems.map(req => {
          const ref = doc(this.firestore, `inventory/${req.itemId}`);
          return transaction.get(ref).then(snap => ({ req, snap, ref }));
        })
      );

      // 2. SEGUNDO: Validaciones basadas en las lecturas
      for (const { req, snap } of inventoryReads) {
        if (!snap.exists()) throw new Error(`El item ${req.itemId} no existe en inventario.`);
        const currentStock = snap.data()?.['stock'] || 0;
        if (currentStock < req.quantity) {
          throw new Error(`Stock insuficiente para item: ${snap.data()?.['name'] || req.itemId}`);
        }
      }

      // 3. TERCERO: Realizar todas las ESCRITURAS
      for (const { req, snap, ref } of inventoryReads) {
        const currentStock = snap.data()?.['stock'] || 0;
        transaction.update(ref, { stock: currentStock - req.quantity });
      }

      transaction.update(orderRef, {
        status: 'EN_PROCESO' as OrderStatus,
        updatedAt: serverTimestamp()
      });
    });
  }

  /**
   * TRANSACCIÓN 2: Completar → Sumar Puntos
   * Invariante SPEC-FIRST Sección 6: Transacción Atómica estricta
   */
  async completeOrder(orderId: string, customerId: string, earnedPoints: number) {
    const orderRef = doc(this.firestore, `orders/${orderId}`);
    const customerRef = doc(this.firestore, `customers/${customerId}`);

    await runTransaction(this.firestore, async (transaction) => {
      const customerDoc = await transaction.get(customerRef);
      const currentPoints = customerDoc.exists() ? (customerDoc.data()?.['points'] || 0) : 0;

      transaction.update(customerRef, { points: currentPoints + earnedPoints });
      transaction.update(orderRef, {
        status: 'COMPLETADO' as OrderStatus,
        updatedAt: serverTimestamp()
      });
    });
  }
}
