import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CustomerService } from '../../../core/services/customer';

@Component({
  selector: 'app-customer-new',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './customer-new.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'class': 'block animate-in fade-in duration-500'
  }
})
export class CustomerNew {
  private customerService = inject(CustomerService);
  private router = inject(Router);

  // Estados de carga y error
  isLoading = signal(false);
  errorMessage = signal('');

  // Estados del formulario (Signals)
  name = signal('');
  email = signal('');
  activePlate = signal('');

  /**
   * Registra un nuevo cliente en Firestore
   */
  async onSubmit() {
    if (!this.name() || !this.activePlate()) {
      this.errorMessage.set('Por favor, completá los campos obligatorios.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      await this.customerService.createCustomer({
        name: this.name(),
        email: this.email(),
        activePlate: this.activePlate().toUpperCase(),
        points: 0,
        membershipId: null
      });

      this.router.navigate(['/app/clientes']);
    } catch (error) {
      console.error('Error al crear cliente:', error);
      this.errorMessage.set('Hubo un error al guardar el cliente. Reintentá.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
