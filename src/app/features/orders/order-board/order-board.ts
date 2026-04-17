import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BranchService } from '../../../core/services/branch';

@Component({
  selector: 'app-order-board',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './order-board.html'
})
export class OrderBoard {
  branchService = inject(BranchService);

  // Mocked signals for visual phase
  // En producción se conectará a firestore collectionData
  orders = [
    { id: 'ORD-1', licensePlate: 'ABC-123', status: 'AGENDADO', package: 'Lavado Premium', time: '10:00 AM' },
    { id: 'ORD-2', licensePlate: 'XYZ-987', status: 'EN_PROCESO', package: 'Cera Carnauba', time: '09:30 AM' },
    { id: 'ORD-3', licensePlate: 'DEF-456', status: 'COMPLETADO', package: 'Lavado Básico', time: '08:00 AM' }
  ];
}
