import { Injectable, inject } from '@angular/core';
import { Firestore, collection, query, where, getDocs, doc, setDoc, updateDoc, serverTimestamp, collectionData } from '@angular/fire/firestore';
import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, Auth, setPersistence, inMemoryPersistence } from 'firebase/auth';
import { Observable, from, map } from 'rxjs';
import { environment } from '../../../environments/environment';

import { UserProfile } from '../models';

@Injectable({
  providedIn: 'root'
})
export class Users {
  private firestore = inject(Firestore);
  private secondaryAuth: Auth;

  constructor() {
    // Inicializar app secundaria para evitar desloguear al admin actual
    let secondaryApp: FirebaseApp;
    if (getApps().find(app => app.name === 'admin-app')) {
      secondaryApp = getApp('admin-app');
    } else {
      secondaryApp = initializeApp(environment.firebase, 'admin-app');
    }
    this.secondaryAuth = getAuth(secondaryApp);

    // FORZAR AISLAMIENTO: No persistir en IndexedDB/LocalStorage
    // Esto evita que esta instancia choque con la del CEO logueado
    setPersistence(this.secondaryAuth, inMemoryPersistence);
  }

  /** Obtiene todos los usuarios administrativos en tiempo real */
  getAllUsers(): Observable<UserProfile[]> {
    const ref = collection(this.firestore, 'users');
    return collectionData(ref, { idField: 'uid' }) as Observable<UserProfile[]>;
  }

  /** Solo Managers en tiempo real */
  getManagers(): Observable<UserProfile[]> {
    return this.getStaffByRoles(['MANAGER']);
  }

  /** Obtiene personal calificado por roles (Filtro jerárquico) */
  getStaffByRoles(roles: string[]): Observable<UserProfile[]> {
    const ref = collection(this.firestore, 'users');
    const q = query(
      ref, 
      where('role', 'in', roles), 
      where('active', '==', true)
    );
    return collectionData(q, { idField: 'uid' }) as Observable<UserProfile[]>;
  }

  /**
   * Crea una cuenta de staff (Manager/Operator)
   * 1. Registra en Firebase Auth secundario
   * 2. Crea el perfil en Firestore
   */
  async createStaffAccount(data: Omit<UserProfile, 'uid' | 'active'>, password: string) {
    // 1. Crear en Auth (Instancia secundaria)
    const userCredential = await createUserWithEmailAndPassword(
      this.secondaryAuth, 
      data.email, 
      password
    );
    const uid = userCredential.user.uid;

    // 2. Crear perfil en Firestore
    const userRef = doc(this.firestore, `users/${uid}`);
    await setDoc(userRef, {
      ...data,
      active: true,
      createdAt: serverTimestamp()
    });

    // 3. Cerrar sesión en la instancia secundaria (limpiar estado interno)
    await this.secondaryAuth.signOut();

    return uid;
  }

  async updateUserStatus(uid: string, active: boolean) {
    const userRef = doc(this.firestore, `users/${uid}`);
    return updateDoc(userRef, { active });
  }

  async updateUser(uid: string, data: Partial<UserProfile>) {
    const userRef = doc(this.firestore, `users/${uid}`);
    return updateDoc(userRef, data);
  }
}
