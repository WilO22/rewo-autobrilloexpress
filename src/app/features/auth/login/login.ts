import { Component, inject, signal } from '@angular/core';
import { Auth, signInWithEmailAndPassword } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ThemeService } from '../../../core/services/theme';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
})
export class Login {
  private auth = inject(Auth);
  private router = inject(Router);
  private themeService = inject(ThemeService);

  loading = signal(false);
  errorMessage = signal('');

  async handleLogin(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;

    this.loading.set(true);
    this.errorMessage.set('');

    try {
      await signInWithEmailAndPassword(this.auth, email, password);
      // Al loguearse con éxito, vamos al área protegida del ERP
      this.router.navigate(['/app']);
    } catch (err: any) {
      this.errorMessage.set('Credenciales inválidas. Verificá tu email y contraseña.');
    } finally {
      this.loading.set(false);
    }
  }
}
