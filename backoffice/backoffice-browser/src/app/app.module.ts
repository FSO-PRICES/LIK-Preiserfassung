import { NgModule, ErrorHandler } from '@angular/core';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { Backoffice } from './app.component';
import { HomePage } from '../pages/home/home';
import { InitializationPage } from '../pages/initialization/initialization';

@NgModule({
  declarations: [
    Backoffice,
    HomePage,
    InitializationPage
  ],
  imports: [
    IonicModule.forRoot(Backoffice)
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    Backoffice,
    HomePage,
    InitializationPage,
  ],
  providers: [{provide: ErrorHandler, useClass: IonicErrorHandler}]
})
export class AppModule {}
