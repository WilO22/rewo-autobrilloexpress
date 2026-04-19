import { Injectable, inject, signal, computed } from '@angular/core';
import { doc, docData, Firestore, collection, collectionData, addDoc, updateDoc, serverTimestamp } from '@angular/fire/firestore';
import { rxResource } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { Branch } from '../models';

@Injectable({
  providedIn: 'root'
})
export class Branches {
  private firestore = inject(Firestore);
  
  public activeBranchId = signal<string | null>(null);
  public showArchived = signal(false);
  
  // Lista de todas las sedes (Modernizado con rxResource con tipado explícito)
  private allBranchesResource = rxResource<Branch[], void>({
    stream: () => collectionData(collection(this.firestore, 'branches'), { idField: 'id' }) as Observable<Branch[]>
  });

  private allBranches = computed<Branch[]>(() => this.allBranchesResource.value() ?? []);

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

  /** 
   * Tema dinámico basado en la sede activa 
   * Esto permite el "Color Coding" Senior que propusimos.
   */
  public currentTheme = computed(() => {
    const activeId = this.activeBranchId();
    if (!activeId) {
      return {
        accent: '#94a3b8', // Slate 400 (Neutral para "Todas las Sedes")
        glow: 'rgba(148, 163, 184, 0.3)',
        border: 'rgba(148, 163, 184, 0.1)',
        name: 'Todas las Sedes'
      };
    }

    const branch = this.allBranches().find(b => b.id === activeId);
    if (!branch) {
      return {
        accent: '#22d3ee',
        glow: 'rgba(34, 211, 238, 0.3)',
        border: 'rgba(34, 211, 238, 0.1)',
        name: 'Cargando...'
      };
    }
    
    // Mapeo de colores por tipo de sede o nombre (Elite UX)
    const colorMap: Record<string, string> = {
      'Sede Norte': '#22d3ee', // Cyan
      'Sede Sur': '#a855f7',   // Purple
      'Sede Central': '#f59e0b', // Amber
      'Default': '#22d3ee'
    };

    const accent = colorMap[branch.name] || colorMap['Default'];
    
    return {
      accent,
      glow: `${accent}40`, // 25% opacity aprox
      border: `${accent}15`, // Muy sutil
      name: branch.name
    };
  });

  setActiveBranch(branchId: string | null) {
    this.activeBranchId.set(branchId);
  }
}

