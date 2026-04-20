import { ApplicationConfig, provideZonelessChangeDetection, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';

import { provideAuth, getAuth } from '@angular/fire/auth';
import { environment } from '../environments/environment';

import { routes } from './app.routes';
import { provideClientHydration, withIncrementalHydration, withEventReplay } from '@angular/platform-browser';
import { Identity } from './core/services/auth';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
    provideClientHydration(withIncrementalHydration(), withEventReplay()),
    {
      provide: APP_INITIALIZER,
      useFactory: (identity: Identity) => () => identity.init(),
      deps: [Identity],
      multi: true
    }
  ],
};
