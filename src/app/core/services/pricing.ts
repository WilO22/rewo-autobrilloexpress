import { Injectable } from '@angular/core';
import { Coupon, MembershipType } from '../models';

export interface PricingResult {
  basePrice: number;
  membershipDiscount: number;
  couponDiscount: number;
  finalPrice: number;
  totalDiscount: number;
}

@Injectable({
  providedIn: 'root'
})
export class Pricing {

  /**
   * Calcula el precio final aplicando jerarquía de descuentos:
   * 1. Membresía (Directo sobre base)
   * 2. Cupón (Sobre el remanente de membresía)
   */
  calculate(
    basePrice: number,
    membershipType?: MembershipType | null,
    coupon?: Coupon | null,
    customerId?: string
  ): PricingResult {
    
    let currentPrice = basePrice;
    let membershipDiscount = 0;
    let couponDiscount = 0;

    // 1. Aplicar Membresía
    if (membershipType === 'ILIMITADO') {
      membershipDiscount = basePrice;
      currentPrice = 0;
    } else if (membershipType === 'PACK_10') {
      // Regla de negocio: 10% de descuento para PACK_10
      membershipDiscount = basePrice * 0.10;
      currentPrice -= membershipDiscount;
    }

    // 2. Aplicar Cupón (Solo si el precio no es ya 0 y hay cupón activo)
    if (currentPrice > 0 && coupon?.isActive) {
      if (coupon.type === 'PERCENT') {
        couponDiscount = currentPrice * (coupon.discount / 100);
      } else {
        couponDiscount = Math.min(coupon.discount, currentPrice); // No descontar más de lo que vale
      }
      currentPrice -= couponDiscount;
    }

    const finalPrice = Math.max(0, currentPrice);
    const totalDiscount = basePrice - finalPrice;

    return {
      basePrice,
      membershipDiscount,
      couponDiscount,
      finalPrice,
      totalDiscount
    };
  }
}
