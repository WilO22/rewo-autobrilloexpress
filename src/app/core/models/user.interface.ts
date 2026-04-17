export type Role = 'SUPER_ADMIN' | 'MANAGER';

export interface User {
  uid: string;
  email: string;
  role: Role;
  branchId: string | null;
}
