import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { registerLocaleData } from '@angular/common';
import localeDa from '@angular/common/locales/da';

registerLocaleData(localeDa);

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
