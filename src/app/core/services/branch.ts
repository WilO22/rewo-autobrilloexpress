import { Injectable, inject, signal } from '@angular/core';
import { 
  Firestore, collection, addDoc, updateDoc, doc, serverTimestamp, collectionData, query, where, or
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
  
  // Stream reactivo de sedes activas
  public branches = toSignal(
    collectionData(
      query(
        collection(this.firestore, 'branches'),
        or(where('active', '==', true), where('active', '==', null))
      ), 
      { idField: 'id' }
    ) as Observable<Branch[]>,
    { initialValue: [] }
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

