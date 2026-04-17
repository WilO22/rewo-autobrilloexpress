export type UnitType = 'litro' | 'unidad';

export interface InventoryItem {
  id: string;
  branchId: string;
  name: string;
  stock: number;
  minStock: number;
  unit: UnitType;
}
