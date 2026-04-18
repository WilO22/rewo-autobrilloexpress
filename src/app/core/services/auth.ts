import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { Auth, user, User } from '@angular/fire/auth';
import { Firestore, doc, docData } from '@angular/fire/firestore';
import { toSignal } from '@angular/core/rxjs-interop';
import { switchMap, of, map, Observable } from 'rxjs';
import { BranchService } from './branch';

export interface UserProfile {
  name: string;
  role: 'SUPER_ADMIN' | 'MANAGER';
  branchId: string | null;
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private branchService = inject(BranchService);

  /** Usuario base de Firebase Auth */
  user = toSignal(user(this.auth));

  /** Perfil extendido desde Firestore */
  profile = toSignal(
    user(this.auth).pipe(
      switchMap(u => {
        if (!u) return of(null);
        const userRef = doc(this.firestore, `users/${u.uid}`);
        return (docData(userRef) as Observable<UserProfile>).pipe(
          map(data => data ? { ...data } : null)
        );
      })
    )
  );

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
