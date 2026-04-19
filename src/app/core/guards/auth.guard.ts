import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { Router } from '@angular/router';
import { Identity } from '../services/auth';
import { map, take, tap, filter, combineLatest } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';

export const authGuard = () => {
  const authService = inject(Identity);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  // En el SERVIDOR (SSR/Prerender), permitimos el paso siempre.
  // La validación real ocurrirá en el navegador durante la hidratación.
  if (isPlatformServer(platformId)) {
    return true;
  }

  return toObservable(authService.authStatus).pipe(
    filter(status => status !== 'loading'), // Impedir el paso mientras se inicializa
    map(status => status === 'authenticated'),
    tap(isAuth => {
      if (!isAuth) {
        router.navigate(['/login']);
      }
    })
  );
};
