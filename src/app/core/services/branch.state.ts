import { Injectable, inject, signal, computed, resource } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Branch } from '../models';
import { environment } from '../../../environments/environment';

/**
 * Senior Architect Pattern: BranchState (RESTful Hydration)
 * Servicio que carga las sedes usando la API REST para optimizar el bundle.
 */
@Injectable({
  providedIn: 'root'
})
export class BranchState {
  private auth = inject(Auth);
  
  public activeBranchId = signal<string | null>(null);
  public showArchived = signal(false);

  /** 
   * Recurso de Sedes vía REST 
   * Usamos resource() porque el loader es una Promesa (fetch)
   */
  public allBranchesResource = resource<Branch[], void>({
    loader: async () => {
      try {
        const url = `https://firestore.googleapis.com/v1/projects/${environment.firebase.projectId}/databases/(default)/documents/branches`;
        const response = await fetch(url);
        
        if (!response.ok) throw new Error('Error al cargar sedes');

        const data = await response.json();
        
        // Mapeo manual de la lista de documentos REST
        return (data.documents || []).map((doc: any) => {
          const id = doc.name.split('/').pop();
          const fields = doc.fields;
          return {
            id,
            name: fields.name?.stringValue || 'Sin nombre',
            active: fields.active?.booleanValue ?? true,
            theme: fields.theme?.mapValue?.fields ? {
              primary: fields.theme.mapValue.fields.primary?.stringValue,
              secondary: fields.theme.mapValue.fields.secondary?.stringValue
            } : undefined
          } as Branch;
        }) as Branch[];
      } catch (error) {
        console.error('REST Branch Loading Error:', error);
        return [];
      }
    }
  });

  public allBranches = computed<Branch[]>(() => this.allBranchesResource.value() ?? []);

  // Filtro reactivo por estado active
  public branches = computed(() => {
    const archived = this.showArchived();
    return this.allBranches().filter(b => 
      archived ? b.active === false : b.active !== false
    );
  });

  /** Motor de Temas Dinámicos (Bi-Tonal) */
  public currentTheme = computed(() => {
    const activeId = this.activeBranchId();
    if (!activeId) return this.getDefaultTheme();

    const branch = this.allBranches().find(b => b.id === activeId);
    if (!branch) return this.getLoadingTheme();
    
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

  private getDefaultTheme() {
    return { accent: null, secondary: null, glow: null, border: null, secondaryGlow: null, name: 'Todas las Sedes' };
  }

  private getLoadingTheme() {
    return { accent: null, secondary: null, glow: null, border: null, secondaryGlow: null, name: 'Cargando Sede...' };
  }
}
