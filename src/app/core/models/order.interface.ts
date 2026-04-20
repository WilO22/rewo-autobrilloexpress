import { Timestamp } from '@angular/fire/firestore';

export type OrderStatus = 'AGENDADO' | 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADO';

export interface Order {
  id: string;
  branchId: string;
  customerId: string;
  vehiclePlate: string;
  serviceId: string;
  couponId: string | null;
  finalPrice: number;
  earnedPoints: number;
  status: OrderStatus;
  scheduledAt: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
