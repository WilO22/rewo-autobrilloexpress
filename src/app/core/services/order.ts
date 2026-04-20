import { Injectable, inject } from '@angular/core';
import {
  Firestore, collection, query, where, limit,
  doc, addDoc, runTransaction, serverTimestamp,
  getDocs, arrayUnion
} from '@angular/fire/firestore';
import { collectionData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Order, OrderStatus, ServicePackage, Coupon, MembershipType } from '../models';
import { Identity } from './auth';
import { Pricing } from './pricing';

@Injectable()
export class Orders {
  private firestore = inject(Firestore);
  private identity = inject(Identity);
  private pricing = inject(Pricing);


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

  /** Todas las órdenes del sistema (Solo para SUPER_ADMIN) */
  getGlobalOrders(maxResults = 200): Observable<Order[]> {
    const ref = collection(this.firestore, 'orders');
    const q = query(ref, limit(maxResults));
    return collectionData(q, { idField: 'id' }) as Observable<Order[]>;
  }

  /** 
   * Helper Senior para generar IDs de slots determinísticos
   * Formato: sucursal_YYYYMMDD_HHmm
   */
  private getSlotId(branchId: string, date: Date | any): string {
    const d = date instanceof Date ? date : date.toDate(); // Maneja JS Date o Firestore Timestamp
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${branchId}_${yyyy}${mm}${dd}_${hh}${min}`;
  }

  async createOrder(data: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) {
    const orderRef = doc(collection(this.firestore, 'orders'));
    const slotId = this.getSlotId(data.branchId, data.scheduledAt);
    const slotRef = doc(this.firestore, `branch_slots/${slotId}`);
    const branchRef = doc(this.firestore, `branches/${data.branchId}`);
    const customerRef = doc(this.firestore, `customers/${data.customerId}`);

    // Búsqueda previa del cupón por ID o Código (para obtener el DocRef antes de la transacción)
    let couponRef: any = null;
    if (data.couponId) {
      couponRef = doc(this.firestore, `coupons/${data.couponId}`);
    }

    return runTransaction(this.firestore, async (transaction) => {
      // 1. LECTURAS
      const [slotSnap, branchSnap, customerSnap, packageSnap] = await Promise.all([
        transaction.get(slotRef),
        transaction.get(branchRef),
        transaction.get(customerRef),
        transaction.get(doc(this.firestore, `services/${data.serviceId}`))
      ]);

      const capacity = branchSnap.exists() ? (branchSnap.data()?.['capacityPerSlot'] || 3) : 3;
      const currentOccupancy = slotSnap.exists() ? (slotSnap.data()?.['count'] || 0) : 0;
      const basePackagePrice = packageSnap.exists() ? (packageSnap.data()?.['price'] || 0) : 0;

      // 2. VALIDACIÓN DE CAPACIDAD
      if (currentOccupancy >= capacity) {
        throw new Error(`Capacidad agotada para este horario (${capacity} vehículos máx).`);
      }

      // 3. LÓGICA COMERCIAL (Membresías & Cupones) - Refactor SOLID ✅
      let couponData: Coupon | null = null;
      if (couponRef) {
        const cSnap = await transaction.get(couponRef);
        couponData = cSnap.exists() ? cSnap.data() as Coupon : null;

        // Validación de uso único (Invariante de Negocio)
        if (couponData?.usedBy?.includes(data.customerId)) {
          couponData = null; // Ignorar cupón si ya fue usado
        }
      }

      const customerData = customerSnap.data();
      const membershipId = customerData?.['membershipId'];
      let membershipType: MembershipType | null = null;
      
      if (membershipId) {
        const mSnap = await transaction.get(doc(this.firestore, `memberships/${membershipId}`));
        membershipType = mSnap.exists() ? mSnap.data()?.['type'] : null;
      }

      // FUENTE DE VERDAD: Usamos basePackagePrice obtenido del servidor, NO lo que mandó el cliente
      const priceResult = this.pricing.calculate(
        basePackagePrice, 
        membershipType,
        couponData,
        data.customerId
      );

      const points = packageSnap.exists() ? (packageSnap.data()?.['pointsValue'] || 0) : 0;

      // Si el cupón fue aplicado, registrar su uso
      if (couponRef && priceResult.couponDiscount > 0) {
        transaction.update(couponRef, {
          usedBy: arrayUnion(data.customerId)
        });
      }

      // 4. ESCRITURAS ATÓMICAS
      transaction.set(slotRef, { 
        count: currentOccupancy + 1,
        updatedAt: serverTimestamp()
      }, { merge: true });

      transaction.set(orderRef, {
        ...data,
        finalPrice: priceResult.finalPrice,
        earnedPoints: points, // SOBREESCRITURA DE SEGURIDAD: Puntos del servidor, no del cliente
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return orderRef.id;
    });
  }

  /**
   * TRANSACCIÓN 1: Agendar → En Proceso → Descuenta Stock + Registro Kardex (SPEC-FIRST Sección 6)
   */
  async startProcessing(orderId: string, servicePkg: ServicePackage) {
    const orderRef = doc(this.firestore, `orders/${orderId}`);
    const userId = this.identity.user()?.uid || 'system';

    await runTransaction(this.firestore, async (transaction) => {
      // 1. PRIMERO: Realizar todas las LECTURAS
      const orderSnap = await transaction.get(orderRef);
      if (!orderSnap.exists()) throw new Error('La orden no existe.');
      const branchId = orderSnap.data()?.['branchId'];

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

      // 3. TERCERO: Realizar todas las ESCRITURAS (Stock + Kardex)
      for (const { req, snap, ref } of inventoryReads) {
        const currentStock = snap.data()?.['stock'] || 0;
        
        // Actualizar Stock principal
        transaction.update(ref, { 
          stock: currentStock - req.quantity,
          updatedAt: serverTimestamp()
        });

        // Registrar movimiento en Kardex
        const movementRef = doc(collection(this.firestore, 'inventory_movements'));
        transaction.set(movementRef, {
          itemId: req.itemId,
          branchId,
          orderId,
          type: 'OUT',
          quantity: req.quantity,
          reason: `Venta Orden #${orderId.slice(-5)}`,
          createdAt: serverTimestamp(),
          createdBy: userId
        });
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
  /**
   * TRANSACCIÓN 2: Completar → Sumar Puntos (Fidelización)
   * Invariante SPEC-FIRST Sección 6 y Directiva Gemini 3.1 Pro
   */
  async completeOrder(orderId: string, customerId: string, earnedPoints: number) {
    const orderRef = doc(this.firestore, `orders/${orderId}`);
    
    // Si no hay cliente asociado, solo completamos la orden sin fidelización
    if (!customerId) {
       return runTransaction(this.firestore, async (transaction) => {
         transaction.update(orderRef, {
           status: 'COMPLETADO' as OrderStatus,
           updatedAt: serverTimestamp()
         });
       });
    }

    const customerRef = doc(this.firestore, `customers/${customerId}`);

    await runTransaction(this.firestore, async (transaction) => {
      // 1. Lecturas
      const orderSnap = await transaction.get(orderRef);
      const customerSnap = await transaction.get(customerRef);

      if (!orderSnap.exists()) throw new Error("La orden no existe.");
      if (orderSnap.data()?.['status'] === 'COMPLETADO') throw new Error("La orden ya está completada.");

      const currentPoints = customerSnap.exists() ? (customerSnap.data()?.['points'] || 0) : 0;

      // 2. Escrituras atómicas
      transaction.update(customerRef, { points: currentPoints + earnedPoints });
      transaction.update(orderRef, {
        status: 'COMPLETADO' as OrderStatus,
        updatedAt: serverTimestamp()
      });
    });
  }
}
