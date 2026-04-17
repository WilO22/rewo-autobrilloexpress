import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-order-new',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './order-new.html'
})
export class OrderNew {
  // Lógica de agendamiento
}
