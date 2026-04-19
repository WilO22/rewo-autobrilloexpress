import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Toasts } from '../../services/ui/toast';
import { ToastItem } from './toast-item';

@Component({
  selector: 'app-toast-container',
  imports: [CommonModule, ToastItem],
  template: `
    <div class="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      @for (toast of toastService.toasts(); track toast.id) {
        <app-toast-item 
          class="pointer-events-auto"
          [toast]="toast" 
          (close)="toastService.remove(toast.id)"
        />
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class ToastContainer {
  protected toastService = inject(Toasts);
}
