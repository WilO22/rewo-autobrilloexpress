import { Injectable, inject, signal, computed, effect, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { Auth, user, User as FireUser, onAuthStateChanged } from '@angular/fire/auth';
import { Firestore, doc, docData } from '@angular/fire/firestore';
import { toSignal, rxResource } from '@angular/core/rxjs-interop';
import { switchMap, of, map, Observable } from 'rxjs';
import { Branches } from './branch';
import { UserProfile } from '../models';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

@Injectable({
  providedIn: 'root'
})
export class Identity {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private branchService = inject(Branches);
  private platformId = inject(PLATFORM_ID);

  /** Usuario base de Firebase Auth */
  user = toSignal(user(this.auth));

  /** Máquina de estados para la sesión */
  authStatus = signal<AuthStatus>('loading');

  /** Perfil extendido desde Firestore (Modernizado con rxResource) */
  private profileResource = rxResource<UserProfile | null, FireUser | null>({
    params: () => this.user() ?? null,
    stream: ({ params: u }) => {
      if (!u) return of(null);
      const userRef = doc(this.firestore, `users/${u.uid}`);
      return docData(userRef) as Observable<UserProfile>;
    }
  });

  /** Perfil extendido de Firestore (Sincronizado) */
  profile = computed<UserProfile>(() => {
    const data = this.profileResource.value();
    const user = this.user();

    // Si no hay datos de Firestore, devolvemos un objeto base seguro
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

    // Aseguramos que el nombre nunca sea undefined/null para evitar crashes de charAt(0)
    return {
      ...data,
      name: data.name || user?.displayName || 'Usuario'
    };
  });

  isProfileLoading = computed(() => this.profileResource.isLoading());

  constructor() {
    /** 
     * Sincronización Automática:
     * Si el perfil tiene una branchId fija (Manager), forzamos esa sede en el sistema.
     */
    effect(() => {
      const p = this.profile();
      if (p?.branchId) {
        this.branchService.setActiveBranch(p.branchId);
      }
    });
  }

  /** 
   * Gatekeeper de Arranque (Procedimiento Industrial):
   * Bloquea el inicio del framework hasta que Firebase confirme el estado de sesión.
   */
  init(): Promise<void> {
    // Si estamos en el SERVIDOR (SSR/Prerender), no podemos determinar la sesión real.
    // Resolvemos inmediatamente sin cambiar el estado (se queda en 'loading')
    // para evitar que el servidor tome decisiones de seguridad erróneas.
    if (isPlatformServer(this.platformId)) {
      console.log('[Auth] SSR - Bypassing Identity Gatekeeper');
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      onAuthStateChanged(this.auth, (u) => {
        console.log('[Auth] Browser - Identity Verified:', u ? 'AUTHENTICATED' : 'GUEST');
        this.authStatus.set(u ? 'authenticated' : 'unauthenticated');
        resolve();
      });
    });
  }

  /** RxJS Stream para servicios que necesiten pipes */
  get profile$() {
    return user(this.auth).pipe(
      switchMap(u => {
        if (!u) return of(null);
        const userRef = doc(this.firestore, `users/${u.uid}`);
        return docData(userRef) as Observable<UserProfile>;
      })
    );
  }

  /** Helpers reactivos */
  isAuthenticated = computed(() => !!this.user());
  userBranchId = computed(() => this.profile()?.branchId);
  userRole = computed(() => this.profile()?.role);

  async logout() {
    return this.auth.signOut();
  }
}
