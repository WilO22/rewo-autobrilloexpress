import { Injectable, inject } from '@angular/core';
import { Firestore, doc, runTransaction } from '@angular/fire/firestore';
import { OrderStatus, ServicePackage } from '../models';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private firestore = inject(Firestore);

  // TRANSACCIÓN 1: Agendar y procesar -> Descuenta Stock
  async startProcessing(orderId: string, servicePkg: ServicePackage) {
    const orderRef = doc(this.firestore, `orders/${orderId}`);
    
    // Invariante Sección 6: Transacción Atómica estricta
    await runTransaction(this.firestore, async (transaction) => {
      // Leer inventario necesario
      for (const req of servicePkg.requiredItems) {
        const invRef = doc(this.firestore, `inventory/${req.itemId}`);
        const invDoc = await transaction.get(invRef);
        
        if (!invDoc.exists()) throw new Error(`El item ${req.itemId} no existe en inventario.`);
        
        const currentStock = invDoc.data()?.['stock'] || 0;
        if (currentStock < req.quantity) {
          throw new Error(`Stock insuficiente para item: ${req.itemId}`);
        }
        
        // Descontar
        transaction.update(invRef, { stock: currentStock - req.quantity });
      }

      // Actualizar estado de la orden
      transaction.update(orderRef, { status: 'EN_PROCESO' as OrderStatus });
    });
  }

  // TRANSACCIÓN 2: Completar -> Sumar Puntos
  async completeOrder(orderId: string, customerId: string, earnedPoints: number) {
    const orderRef = doc(this.firestore, `orders/${orderId}`);
    const customerRef = doc(this.firestore, `customers/${customerId}`);

    // Invariante Sección 6: Transacción Atómica estricta
    await runTransaction(this.firestore, async (transaction) => {
      const customerDoc = await transaction.get(customerRef);
      const currentPoints = customerDoc.exists() ? (customerDoc.data()?.['points'] || 0) : 0;
      
      transaction.update(customerRef, { points: currentPoints + earnedPoints });
      transaction.update(orderRef, { status: 'COMPLETADO' as OrderStatus });
    });
  }
}
