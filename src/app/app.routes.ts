import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/auth/login/login').then(m => m.Login) },
  { 
    path: '', 
    loadComponent: () => import('./core/layout/main-layout/main-layout').then(m => m.MainLayout),
    children: [
      { path: '', redirectTo: 'orders', pathMatch: 'full' },
      // Submodulos irán aquí próximamente
    ]
  },
  { path: '**', redirectTo: '' }
];
