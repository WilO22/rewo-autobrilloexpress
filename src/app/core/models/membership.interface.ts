export type MembershipType = 'ILIMITADO' | 'PACK_10';

export interface Membership {
  id: string;
  name: string;
  type: MembershipType;
  price: number;
}
