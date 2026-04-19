export interface InventoryMovement {
  id?: string;
  itemId: string;
  branchId: string;
  orderId?: string; // Relación con la venta si aplica
  type: 'IN' | 'OUT';
  quantity: number;
  reason: string;
  createdAt: any;
  createdBy: string; // userId
}
