import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { Customers } from '../../../core/services/customer';
import { Customer } from '../../../core/models';

@Component({
  selector: 'app-customer-list',
  imports: [RouterLink, DecimalPipe],
  templateUrl: './customer-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomerList {
  private customerService = inject(Customers);

  customers = toSignal(this.customerService.getCustomers(), { initialValue: [] as Customer[] });

  /** Determina si el cliente es VIB (>= 1000 puntos) */
  isVib(customer: Customer): boolean {
    return customer.points >= 1000;
  }
}
