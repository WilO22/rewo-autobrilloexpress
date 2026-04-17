import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/auth/login/login').then(m => m.Login) },
  { 
    path: 'app', 
    loadComponent: () => import('./core/layout/main-layout/main-layout').then(m => m.MainLayout),
    children: [
      { path: '', redirectTo: 'agenda', pathMatch: 'full' },
      { path: 'agenda', loadComponent: () => import('./features/orders/order-board/order-board').then(m => m.OrderBoard) },
      { path: 'agenda/nueva', loadComponent: () => import('./features/orders/order-new/order-new').then(m => m.OrderNew) },
      { path: 'agenda', loadComponent: () => import('./features/orders/order-board/order-board').then(m => m.OrderBoard) },
      { path: 'agenda/nueva', loadComponent: () => import('./features/orders/order-new/order-new').then(m => m.OrderNew) },
      { path: 'clientes', loadComponent: () => import('./features/customers/customer-list/customer-list').then(m => m.CustomerList) },
      { path: 'clientes/nuevo', loadComponent: () => import('./features/customers/customer-new/customer-new').then(m => m.CustomerNew) },
      { path: 'membresias', loadComponent: () => import('./features/memberships/membership-list/membership-list').then(m => m.MembershipList) },
      { path: 'inventario', loadComponent: () => import('./features/inventory/inventory-list').then(m => m.InventoryList) }
    ]
  },
  { path: '**', redirectTo: '' }
];
