import { Injectable, inject, signal } from '@angular/core';
import { Firestore, collection, getDocs } from '@angular/fire/firestore';
import { Branch } from '../models';

@Injectable({
  providedIn: 'root'
})
export class BranchService {
  private firestore = inject(Firestore);
  
  // Aislamiento Multi-tenant vía Signals
  public activeBranchId = signal<string | null>(null);
  public branches = signal<Branch[]>([]);

  async loadBranches() {
    const branchesRef = collection(this.firestore, 'branches');
    const snapshot = await getDocs(branchesRef);
    const loaded = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Branch));
    
    this.branches.set(loaded);
    
    // Auto-seleccionar primera sucursal si no hay ninguna activa
    if (loaded.length > 0 && !this.activeBranchId()) {
      this.activeBranchId.set(loaded[0].id);
    }
  }

  setActiveBranch(branchId: string) {
    this.activeBranchId.set(branchId);
  }
}
