import { EnvironmentProviders, Provider } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideTranslateService } from '@ngx-translate/core';

export const commonTestProviders: Array<Provider | EnvironmentProviders> = [
  provideHttpClient(),
  provideRouter([]),
  provideNoopAnimations(),
  provideTranslateService({
    fallbackLang: 'fr',
    lang: 'fr'
  })
];
