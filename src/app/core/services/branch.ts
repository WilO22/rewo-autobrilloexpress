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
        accent: null,
        secondary: null,
        glow: null,
        border: null,
        secondaryGlow: null,
        name: 'Todas las Sedes'
      };
    }

    const branch = this.allBranches().find(b => b.id === activeId);
    if (!branch) {
      return {
        accent: null,
        secondary: null,
        glow: null,
        border: null,
        secondaryGlow: null,
        name: 'Cargando Sede...'
      };
    }
    
    // Extracción dinámica de datos desde Firestore (Fase 3: Motor Bi-Tonal)
    const theme = branch.theme;
    const accent = theme?.primary || null;
    const secondary = theme?.secondary || null;
    
    return {
      accent,
      secondary,
      glow: accent ? `${accent}40` : null, 
      border: accent ? `${accent}15` : null,
      secondaryGlow: secondary ? `${secondary}30` : null,
      name: branch.name
    };
  });

  setActiveBranch(branchId: string | null) {
    this.activeBranchId.set(branchId);
  }
}

