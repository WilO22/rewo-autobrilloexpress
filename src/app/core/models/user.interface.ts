export type Role = 'SUPER_ADMIN' | 'MANAGER' | 'OPERATOR';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: Role;
  branchId: string | null;
  active: boolean;
  createdAt?: any;
}
