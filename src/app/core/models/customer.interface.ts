export interface Customer {
  id: string;
  name: string;
  email: string;
  points: number;
  membershipId: string | null;
  activePlate: string;
}
