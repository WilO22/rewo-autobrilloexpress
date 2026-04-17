export interface RequiredItem {
  itemId: string;
  quantity: number;
}

export interface ServicePackage {
  id: string;
  name: string;
  price: number;
  pointsValue: number;
  requiredItems: RequiredItem[];
}
