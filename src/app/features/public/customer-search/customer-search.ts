import { Component, inject, signal, effect, PLATFORM_ID } from '@angular/core';
import { Firestore, collection, query, where, getDocs } from '@angular/fire/firestore';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Branches } from '../../../core/services/branch';
import { ThemeService } from '../../../core/services/theme';

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
  private firestore = inject(Firestore);
  public branchService = inject(Branches);
  private themeService = inject(ThemeService);
  private platformId = inject(PLATFORM_ID);
  
  plate = signal('');
  customer = signal<any>(null);
  loading = signal(false);
  error = signal('');

  // El motor de temas ahora está centralizado en ThemeService (SOLID)

  async onSearch() {
    const plateInput = this.plate().trim().toUpperCase();
    if (!plateInput) return;

    this.loading.set(true);
    this.error.set('');
    this.customer.set(null);

    try {
      const q = query(
        collection(this.firestore, 'customers'),
        where('activePlate', '==', plateInput)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        this.error.set('No encontramos ningún vehículo con esa matrícula. ¡Vení a visitarnos!');
      } else {
        this.customer.set(querySnapshot.docs[0].data());
      }
    } catch (err) {
      this.error.set('Tuvimos un problema al buscar. Reintentá en un momento.');
    } finally {
      this.loading.set(false);
    }
  }
}
