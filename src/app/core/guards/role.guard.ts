import { inject } from '@angular/core';
import { Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth';
import { map, take, tap } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';

export const roleGuard = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const expectedRole = route.data['role'];

  return toObservable(authService.profile).pipe(
    map(profile => profile?.role === expectedRole),
    tap(hasRole => {
      if (!hasRole) {
        router.navigate(['/app']);
      }
    })
  );
};
