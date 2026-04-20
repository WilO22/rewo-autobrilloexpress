import { Component, inject, signal, effect, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BranchState } from '../../../core/services/branch.state';
import { ThemeService } from '../../../core/services/theme';
import { environment } from '../../../../environments/environment';

/**
 * Senior Architect Pattern: CustomerSearch (RESTful True Lite)
 * Optimización de Landing: Realiza búsquedas públicas usando la API REST.
 * Esto elimina la dependencia del SDK de Firestore en la carga inicial.
 */
@Component({
  selector: 'app-customer-search',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './customer-search.html',
  styles: [`
    .glass-card {
      background: rgba(8, 14, 30, 0.6);
      backdrop-filter: blur(12px);
      border: 1px solid var(--app-border);
      transition: border 0.5s ease;
    }
  `]
})
export class CustomerSearch {
  public branchService = inject(BranchState);
  private themeService = inject(ThemeService);
  private platformId = inject(PLATFORM_ID);
  
  plate = signal('');
  customer = signal<any>(null);
  loading = signal(false);
  error = signal('');

  async onSearch() {
    const plateInput = this.plate().trim().toUpperCase();
    if (!plateInput) return;

    this.loading.set(true);
    this.error.set('');
    this.customer.set(null);

    try {
      // Usamos la API REST con runQuery para una búsqueda precisa y liviana
      const url = `https://firestore.googleapis.com/v1/projects/${environment.firebase.projectId}/databases/(default)/documents:runQuery`;
      
      const queryBody = {
        structuredQuery: {
          from: [{ collectionId: 'customers' }],
          where: {
            fieldFilter: {
              field: { fieldPath: 'activePlate' },
              op: 'EQUAL',
              value: { stringValue: plateInput }
            }
          },
          limit: 1
        }
      };

      const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify(queryBody)
      });

      if (!response.ok) throw new Error('Error en búsqueda REST');

      const results = await response.json();
      
      // La API runQuery devuelve un array de objetos { document: ... }
      if (!results || results.length === 0 || !results[0].document) {
        this.error.set('No encontramos ningún vehículo con esa matrícula. ¡Vení a visitarnos!');
      } else {
        const doc = results[0].document;
        const fields = doc.fields;
        
        // Mapeamos los campos de la respuesta REST al formato del objeto customer
        this.customer.set({
          name: fields.name?.stringValue || 'Cliente',
          activePlate: fields.activePlate?.stringValue || plateInput,
          email: fields.email?.stringValue || '',
          // Si hay más campos necesarios, agregarlos aquí siguiendo el patrón REST
        });
      }
    } catch (err) {
      console.error('REST Search Error:', err);
      this.error.set('Tuvimos un problema al buscar. Reintentá en un momento.');
    } finally {
      this.loading.set(false);
    }
  }
}
