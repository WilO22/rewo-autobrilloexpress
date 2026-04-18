import { Injectable, inject, signal } from '@angular/core';
import { 
  Firestore, collection, getDocs, addDoc, updateDoc, doc, serverTimestamp 
} from '@angular/fire/firestore';
import { Branch } from '../models';

@Injectable({
  providedIn: 'root'
})
export class BranchService {
  private firestore = inject(Firestore);
  
  public activeBranchId = signal<string | null>(null);
  public branches = signal<Branch[]>([]);

  async loadBranches() {
    const branchesRef = collection(this.firestore, 'branches');
    const snapshot = await getDocs(branchesRef);
    const loaded = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Branch));
    this.branches.set(loaded);
  }

  async createBranch(data: Omit<Branch, 'id'>) {
    const ref = collection(this.firestore, 'branches');
    const res = await addDoc(ref, {
      ...data,
      createdAt: serverTimestamp()
    });
    await this.loadBranches(); // Refrescar lista global
    return res;
  }

  async updateBranch(id: string, data: Partial<Branch>) {
    const ref = doc(this.firestore, `branches/${id}`);
    const res = await updateDoc(ref, {
      ...data,
      updatedAt: serverTimestamp()
    });
    await this.loadBranches(); // Refrescar lista global
    return res;
  }

  setActiveBranch(branchId: string | null) {
    this.activeBranchId.set(branchId);
  }
}

