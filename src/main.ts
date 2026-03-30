import {platformBrowser} from '@angular/platform-browser';
import {AppModule} from './app/app-module';

// Polyfill for sockjs-client and stomp
(window as any).global = window;

platformBrowser().bootstrapModule(AppModule, {})
  .catch(err => console.error(err));
