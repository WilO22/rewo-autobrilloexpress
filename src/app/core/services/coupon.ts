import { Injectable, inject } from '@angular/core';
import { 
  Firestore, collection, query, orderBy, 
  doc, docData, collectionData, addDoc, updateDoc, deleteDoc,
  where
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Coupon } from '../models';

@Injectable({
  providedIn: 'root'
})
export class CouponService {
  private firestore = inject(Firestore);

  /**
   * Obtiene todos los cupones.
   */
  getCoupons(): Observable<Coupon[]> {
    const ref = collection(this.firestore, 'coupons');
    const q = query(ref, orderBy('code'));
    return collectionData(q, { idField: 'id' }) as Observable<Coupon[]>;
  }

  /**
   * Obtiene solo los cupones activos.
   */
  getActiveCoupons(): Observable<Coupon[]> {
    const ref = collection(this.firestore, 'coupons');
    const q = query(ref, where('isActive', '==', true), orderBy('code'));
    return collectionData(q, { idField: 'id' }) as Observable<Coupon[]>;
  }

  /**
   * Busca un cupón por su código exacto.
   */
  getCouponByCode(code: string): Observable<Coupon[]> {
    const ref = collection(this.firestore, 'coupons');
    const q = query(ref, where('code', '==', code.toUpperCase()));
    return collectionData(q, { idField: 'id' }) as Observable<Coupon[]>;
  }

  /**
   * Crea un nuevo cupón.
   */
  async addCoupon(coupon: Omit<Coupon, 'id'>) {
    const ref = collection(this.firestore, 'coupons');
    return addDoc(ref, { 
      ...coupon, 
      code: coupon.code.toUpperCase() 
    });
  }

  /**
   * Actualiza un cupón existente.
   */
  async updateCoupon(id: string, coupon: Partial<Coupon>) {
    const ref = doc(this.firestore, `coupons/${id}`);
    const updateData = { ...coupon };
    if (updateData.code) updateData.code = updateData.code.toUpperCase();
    return updateDoc(ref, updateData);
  }

  /**
   * Elimina un cupón.
   */
  async deleteCoupon(id: string) {
    const ref = doc(this.firestore, `coupons/${id}`);
    return deleteDoc(ref);
  }
}
