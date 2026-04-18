import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class Toasts {
  /** Estado reactivo de los toasts activos */
  private toastsSignal = signal<Toast[]>([]);
  
  /** Exposición pública de solo lectura */
  readonly toasts = this.toastsSignal.asReadonly();

  /**
   * Muestra una notificación en pantalla
   */
  show(message: string, type: ToastType = 'info', duration: number = 5000) {
    const id = crypto.randomUUID();
    const newToast: Toast = { id, message, type, duration };

    this.toastsSignal.update(all => [...all, newToast]);

    if (duration > 0) {
      setTimeout(() => this.remove(id), duration);
    }
    
    return id;
  }

  /**
   * Remueve una notificación manual o automáticamente
   */
  remove(id: string) {
    this.toastsSignal.update(all => all.filter(t => t.id !== id));
  }

  /** Helpers rápidos para los flujos operativos */
  success(msg: string) { return this.show(msg, 'success'); }
  error(msg: string) { return this.show(msg, 'error', 7000); }
  info(msg: string) { return this.show(msg, 'info'); }
}
