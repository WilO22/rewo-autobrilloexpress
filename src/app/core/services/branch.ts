import { Injectable, inject } from '@angular/core';
import { doc, Firestore, collection, addDoc, updateDoc, serverTimestamp } from '@angular/fire/firestore';
import { Branch } from '../models';
import { BranchState } from './branch.state';

/**
 * Senior Architect Pattern: BranchManager
 * Servicio que contiene SOLO la lógica administrativa.
 * Se carga bajo demanda cuando se accede a las rutas de gestión.
 */
@Injectable()
export class Branches {
  private firestore = inject(Firestore);
  private state = inject(BranchState);

  // Delegación de señales al estado centralizado
  public activeBranchId = this.state.activeBranchId;
  public showArchived = this.state.showArchived;
  public branches = this.state.branches;
  public currentTheme = this.state.currentTheme;

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

  async deleteBranch(id: string) {
    const ref = doc(this.firestore, `branches/${id}`);
    return updateDoc(ref, {
      active: false,
      deletedAt: serverTimestamp()
    });
  }

  async activateBranch(id: string) {
    const ref = doc(this.firestore, `branches/${id}`);
    return updateDoc(ref, {
      active: true,
      updatedAt: serverTimestamp(),
      deletedAt: null
    });
  }

  setActiveBranch(branchId: string | null) {
    this.state.setActiveBranch(branchId);
  }
}


