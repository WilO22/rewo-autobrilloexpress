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
export class BranchService {
  private firestore = inject(Firestore);
  
  public activeBranchId = signal<string | null>(null);
  
  // Stream de datos crudos (Consulta simple para evitar errores de índices)
  private allBranches = toSignal(
    collectionData(collection(this.firestore, 'branches'), { idField: 'id' }) as Observable<Branch[]>,
    { initialValue: [] }
  );

  // Señal computada para sedes activas (Reactividad local, más segura y rápida)
  public branches = computed(() => 
    this.allBranches().filter(b => b.active !== false)
  );

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

  setActiveBranch(branchId: string | null) {
    this.activeBranchId.set(branchId);
  }
}

