export interface Branch {
  id: string;
  name: string;
  location: string;
  managerId: string;
  active?: boolean;
  theme?: {
    primary: string;
    secondary: string;
    id?: string;
  };
  capacityPerSlot?: number;
  createdAt?: any;
  updatedAt?: any;
  deletedAt?: any;
}
