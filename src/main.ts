import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import 'zone.js'; // Included with Angular CLI.
import { AppComponent } from './app/app.component';
import { provideZoneChangeDetection } from '@angular/core';

bootstrapApplication(AppComponent, {
    providers: [
        provideAnimationsAsync(),
        provideZoneChangeDetection({ eventCoalescing: true }),
    ]
})
  .catch(console.error);
