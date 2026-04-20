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
    loadChildren: () => import('./features/app.routes').then(m => m.APP_ROUTES)
  },
  { path: '**', redirectTo: '' }
];
