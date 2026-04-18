import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Identity } from '../services/auth';
import { map, take, tap, filter, combineLatest } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';

export const authGuard = () => {
  const authService = inject(Identity);
  const router = inject(Router);

  return combineLatest([
    toObservable(authService.user),
    toObservable(authService.isInitialLoading)
  ]).pipe(
    filter(([_, loading]) => !loading), // Esperar a que termine la carga inicial
    map(([user, _]) => !!user),
    tap(isAuth => {
      if (!isAuth) {
        router.navigate(['/login']);
      }
    })
  );
};
