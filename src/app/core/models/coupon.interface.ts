import { Timestamp } from '@angular/fire/firestore';
export type CouponType = 'PERCENT' | 'FIXED';

export interface Coupon {
  id: string;
  code: string;
  discount: number;
  type: CouponType;
  isActive: boolean;
  usedBy?: string[]; // IDs de clientes que ya usaron este cupón
  expiresAt?: Timestamp;   // Timestamp de vencimiento
}
