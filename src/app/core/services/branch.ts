import { Injectable, inject, signal, computed } from '@angular/core';
import { 
  Firestore, collection, addDoc, updateDoc, doc, serverTimestamp, collectionData
} from '@angular/fire/firestore';
import { Branch } from '../models';
import { Observable } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root'
})
export class Branches {
  private firestore = inject(Firestore);
  
  public activeBranchId = signal<string | null>(null);
  public showArchived = signal(false);
  
  // Stream de datos crudos (Consulta simple para evitar errores de índices)
  private allBranches = toSignal(
    collectionData(collection(this.firestore, 'branches'), { idField: 'id' }) as Observable<Branch[]>,
    { initialValue: [] }
  );

  // Señal computada para sedes (Filtro reactivo por estado active)
  public branches = computed(() => {
    const archived = this.showArchived();
    return this.allBranches().filter(b => 
      archived ? b.active === false : b.active !== false
    );
  });

  async createBranch(data: Omit<Branch, 'id'>) {
    const ref = collection(this.firestore, 'branches');
    return addDoc(ref, {
      ...data,
      active: true,
      createdAt: serverTimestamp()
    });
  }

  async updateBranch(id: string, data: Partial<Branch>) {
    const ref = doc(this.firestore, `branches/${id}`);
    return updateDoc(ref, {
      ...data,
      updatedAt: serverTimestamp()
    });
  }

  /** Archivamiento de sede (Borrado Lógico) */
  async deleteBranch(id: string) {
    const ref = doc(this.firestore, `branches/${id}`);
    return updateDoc(ref, {
      active: false,
      deletedAt: serverTimestamp()
    });
  }

  /** Reactivación de sede */
  async activateBranch(id: string) {
    const ref = doc(this.firestore, `branches/${id}`);
    return updateDoc(ref, {
      active: true,
      updatedAt: serverTimestamp(),
      deletedAt: null
    });
  }

  setActiveBranch(branchId: string | null) {
    this.activeBranchId.set(branchId);
  }
}

