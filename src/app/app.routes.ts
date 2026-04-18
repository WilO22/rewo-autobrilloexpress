import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { 
    path: '', 
    loadComponent: () => import('./features/public/customer-search/customer-search').then(m => m.CustomerSearch) 
  },
  { 
    path: 'login', 
    loadComponent: () => import('./features/auth/login/login').then(m => m.Login) 
  },
  { 
    path: 'app', 
    canActivate: [authGuard],
    loadComponent: () => import('./core/layout/main-layout/main-layout').then(m => m.MainLayout),
    children: [
      { path: '', redirectTo: 'agenda', pathMatch: 'full' },
      { path: 'agenda', loadComponent: () => import('./features/orders/order-board/order-board').then(m => m.OrderBoard) },
      { path: 'agenda/nueva', loadComponent: () => import('./features/orders/order-new/order-new').then(m => m.OrderNew) },
      { 
        path: 'reportes', 
        canActivate: [() => import('./core/guards/role.guard').then(m => m.roleGuard)],
        data: { role: 'SUPER_ADMIN' },
        loadComponent: () => import('./features/reports/dashboard/dashboard').then(m => m.Dashboard)
      },
      { path: 'clientes', loadComponent: () => import('./features/customers/customer-list/customer-list').then(m => m.CustomerList) },
      { path: 'clientes/nuevo', loadComponent: () => import('./features/customers/customer-new/customer-new').then(m => m.CustomerNew) },
      { path: 'membresias', loadComponent: () => import('./features/memberships/membership-list/membership-list').then(m => m.MembershipList) },
      { path: 'inventario', loadComponent: () => import('./features/inventory/inventory-list').then(m => m.InventoryList) }
    ]
  },
  { path: '**', redirectTo: '' }
];
