import { Injectable, inject, signal } from '@angular/core';
import { Firestore, collection, getDocs } from '@angular/fire/firestore';
import { Branch } from '../models';

@Injectable({
  providedIn: 'root'
})
export class BranchService {
  private firestore = inject(Firestore);
  
  // Aislamiento Multi-tenant vía Signals
  // null representa "Todas las Sedes" (Global)
  public activeBranchId = signal<string | null>(null);
  public branches = signal<Branch[]>([]);

  async loadBranches() {
    const branchesRef = collection(this.firestore, 'branches');
    const snapshot = await getDocs(branchesRef);
    const loaded = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Branch));
    
    this.branches.set(loaded);
    
    // NOTA: Para el CEO mantendremos null por defecto (Global).
    // El auto-seleccionar la primera sede solo debería ocurrir si es estrictamente necesario
    // o si el rol del usuario lo requiere (esto se maneja mejor desde los componentes).
  }

  setActiveBranch(branchId: string | null) {
    this.activeBranchId.set(branchId);
  }
}
