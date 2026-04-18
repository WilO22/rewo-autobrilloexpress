import { Component, inject, signal } from '@angular/core';
import { Firestore, collection, query, where, getDocs } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-customer-search',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './customer-search.html',
  styles: [`
    .glass-card {
      background: rgba(8, 14, 30, 0.6);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(34, 211, 238, 0.2);
    }
  `]
})
export class CustomerSearch {
  private firestore = inject(Firestore);
  
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
