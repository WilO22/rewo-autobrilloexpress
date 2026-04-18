import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { map, take, tap } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';

export const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return toObservable(authService.user).pipe(
    map(user => !!user),
    tap(isAuth => {
      if (!isAuth) {
        router.navigate(['/login']);
      }
    })
  );
};
