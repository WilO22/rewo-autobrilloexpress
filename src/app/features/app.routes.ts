import { Routes } from '@angular/router';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';

// Senior Architect: Provisión centralizada de servicios operativos
// Estos servicios dependen del SDK de Firestore y solo deben existir
// dentro del scope administrativo de la aplicación.
import { Orders } from '../core/services/order';
import { Inventory } from '../core/services/inventory';
import { Customers } from '../core/services/customer';
import { Branches } from '../core/services/branch';
import { Coupons } from '../core/services/coupon';
import { Memberships } from '../core/services/membership';
import { Reports } from '../core/services/report';
import { ServicePackages } from '../core/services/service-package';
import { Users } from '../core/services/user';

export const APP_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('../core/layout/main-layout/main-layout').then(m => m.MainLayout),
    providers: [
      provideFirestore(() => getFirestore()),
      // Sandbox Operativo: Inyectamos los servicios aquí para que tengan acceso a Firestore
      // y no contaminen el bundle inicial/root injector.
      Orders,
      Inventory,
      Customers,
      Branches,
      Coupons,
      Memberships,
      Reports,
      ServicePackages,
      Users
    ],
    children: [
      { path: '', redirectTo: 'agenda', pathMatch: 'full' },
      { path: 'agenda', loadComponent: () => import('./orders/order-board/order-board').then(m => m.OrderBoard) },
      { path: 'agenda/nueva', loadComponent: () => import('./orders/order-new/order-new').then(m => m.OrderNew) },
      { 
        path: 'reportes', 
        canActivate: [() => import('../core/guards/role.guard').then(m => m.roleGuard)],
        data: { role: 'SUPER_ADMIN' },
        loadComponent: () => import('./reports/dashboard/dashboard').then(m => m.Dashboard)
      },
      { path: 'clientes', loadComponent: () => import('./customers/customer-list/customer-list').then(m => m.CustomerList) }, // Mapping fixed if needed
      { path: 'clientes/nuevo', loadComponent: () => import('./customers/customer-new/customer-new').then(m => m.CustomerNew) },
      { path: 'clientes/:id', loadComponent: () => import('./customers/customer-detail/customer-detail').then(m => m.CustomerDetail) },
      { 
        path: 'sedes', 
        canActivate: [() => import('../core/guards/role.guard').then(m => m.roleGuard)],
        data: { role: 'SUPER_ADMIN' },
        loadComponent: () => import('./branches/branch-list').then(m => m.BranchList) 
      },
      { 
        path: 'equipo', 
        canActivate: [() => import('../core/guards/role.guard').then(m => m.roleGuard)],
        data: { role: 'SUPER_ADMIN' },
        loadComponent: () => import('./team/team-list').then(m => m.TeamList) 
      },
      { path: 'membresias', loadComponent: () => import('./memberships/membership-list/membership-list').then(m => m.MembershipList) },
      { path: 'inventario', loadComponent: () => import('./inventory/inventory-list').then(m => m.InventoryList) },
      {
        path: 'marketing',
        canActivate: [() => import('../core/guards/role.guard').then(m => m.roleGuard)],
        data: { role: 'SUPER_ADMIN' },
        loadComponent: () => import('./marketing/marketing-list').then(m => m.MarketingList)
      }
    ]
  }
];
