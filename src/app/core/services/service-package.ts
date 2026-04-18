import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { ServicePackage } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ServicePackages {
  private firestore = inject(Firestore);

  /** Catálogo de paquetes de servicio (lectura pública según SPEC-FIRST Sección 11) */
  getPackages(): Observable<ServicePackage[]> {
    const ref = collection(this.firestore, 'services');
    return collectionData(ref, { idField: 'id' }) as Observable<ServicePackage[]>;
  }
}
