import { Injectable, inject, PLATFORM_ID, signal, computed, effect, resource } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { Auth, user, User as FireUser, onAuthStateChanged, signOut } from '@angular/fire/auth';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { BranchState } from './branch.state';
import { UserProfile } from '../models';
import { environment } from '../../../environments/environment';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

/**
 * Senior Architect Pattern: Identity Service (RESTful Hydra)
 * Encargado de la sesión y el perfil del usuario.
 * OPTIMIZACIÓN CRÍTICA: Usa la API REST para el arranque, eliminando el SDK de Firestore
 * del bundle inicial para garantizar un peso < 500kB.
 */
@Injectable({
  providedIn: 'root'
})
export class Identity {
  private auth = inject(Auth);
  private platformId = inject(PLATFORM_ID);
  private router = inject(Router);
  private branchState = inject(BranchState);

  /** Usuario base de Firebase Auth */
  user = toSignal(user(this.auth));

  /** Máquina de estados para la sesión */
  authStatus = signal<AuthStatus>('loading');

  /** 
   * Perfil extendido vía REST API (Optimizado para bundle size) 
   * Hecho: Usar fetch() nativo tiene costo CERO en el bundle inicial.
   * Angular 20/21 Signature: uses 'params' instead of 'request'.
   */
  private profileResource = resource<UserProfile | null, FireUser | null>({
    defaultValue: null,
    params: () => this.user() ?? null,
    loader: async ({ params: usuario }) => {
      if (!usuario) return null;

      try {
        const token = await usuario.getIdToken();
        const url = `https://firestore.googleapis.com/v1/projects/${environment.firebase.projectId}/databases/(default)/documents/users/${usuario.uid}`;
        
        const response = await fetch(url, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Error al cargar perfil vía REST');

        const data = await response.json();
        
        return {
          uid: usuario.uid,
          email: usuario.email || '',
          name: data.fields?.name?.stringValue || usuario.displayName || 'Usuario',
          role: (data.fields?.role?.stringValue as any) || 'OPERATOR',
          branchId: data.fields?.branchId?.stringValue || null,
          active: data.fields?.active?.booleanValue ?? true
        } as UserProfile;
      } catch (error) {
        console.error('REST Bootstrap Error:', error);
        return null;
      }
    }
  });

  /** 
   * Perfil Principal (Computed Signal) 
   * Proporciona un objeto seguro incluso si la carga falla o está en curso.
   */
  profile = computed<UserProfile>(() => {
    const data = this.profileResource.value();
    const user = this.user();

    if (!data) {
      return {
        uid: user?.uid ?? '',
        email: user?.email ?? '',
        name: user?.displayName || user?.email?.split('@')[0] || 'Usuario',
        role: 'OPERATOR',
        branchId: null,
        active: true
      };
    }

    return {
      ...data,
      name: data.name || user?.displayName || 'Usuario'
    };
  });

  /** Stream reactivo para servicios Legacy (como Inventory) que usan RxJS */
  profile$ = toObservable(this.profile);

  isProfileLoading = computed(() => this.profileResource.isLoading());
  isAuthenticated = computed(() => !!this.user());
  userBranchId = computed(() => this.profile().branchId);
  userRole = computed(() => this.profile().role);

  /** 
   * Sincronización Automática:
   * Si el perfil tiene una branchId fija (Manager/Operator), forzamos esa sede.
   */
  private branchSyncEffect = effect(() => {
    const p = this.profile();
    if (p?.branchId) {
      this.branchState.activeBranchId.set(p.branchId);
    }
  });

  /** 
   * Gatekeeper de Arranque:
   * Bloquea el inicio del framework hasta que Firebase confirme la sesión.
   */
  init(): Promise<void> {
    if (isPlatformServer(this.platformId)) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      onAuthStateChanged(this.auth, (u) => {
        this.authStatus.set(u ? 'authenticated' : 'unauthenticated');
        resolve();
      });
    });
  }

  async logout() {
    await signOut(this.auth);
    this.authStatus.set('unauthenticated');
    this.router.navigate(['/login']);
  }
}
