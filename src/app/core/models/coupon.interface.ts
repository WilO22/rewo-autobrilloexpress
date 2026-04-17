export type CouponType = 'PERCENT' | 'FIXED';

export interface Coupon {
  id: string;
  code: string;
  discount: number;
  type: CouponType;
  isActive: boolean;
}
