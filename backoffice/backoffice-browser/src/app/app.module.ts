import { ErrorHandler, NgModule, LOCALE_ID } from '@angular/core';
import { StoreModule } from '@ngrx/store';
import { BrowserModule } from '@angular/platform-browser';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

import { PefDialogService, PefComponentsModule } from 'lik-shared';

import { Backoffice } from './app.component';
import { PefMenuModule } from '../components/pef-menu';
import { PefDialogLoginModule, PefDialogLoginComponent } from '../components/pef-dialog-login';

import { ExportToPrestaModule } from '../pages/export-to-presta';
import { ImportModule } from '../pages/import';
import { PreiserheberModule } from '../pages/preiserheber';
import { PreismeldestelleModule } from '../pages/preismeldestelle';
import { PreismeldungModule } from '../pages/preismeldung';
import { SettingsModule } from '../pages/settings';
import { StatusModule } from '../pages/status';

import { PouchService } from '../services/PouchService';

import { BO_EFFECTS } from '../effects';
import { reducer } from '../reducers';

@NgModule({
    declarations: [
        Backoffice
    ],
    imports: [
        BrowserModule,
        ExportToPrestaModule,
        ImportModule,
        IonicModule.forRoot(Backoffice),
        PefComponentsModule,
        PefDialogLoginModule,
        PefMenuModule,
        PreiserheberModule,
        PreismeldestelleModule,
        PreismeldungModule,
        SettingsModule,
        StatusModule,
        StoreModule.provideStore(reducer),
        ...BO_EFFECTS
    ],
    bootstrap: [IonicApp],
    entryComponents: [
        Backoffice,
        PefDialogLoginComponent
    ],
    providers: [
        { provide: ErrorHandler, useClass: IonicErrorHandler },
        { provide: LOCALE_ID, useValue: 'de-CH' },
        PefDialogService,
        PouchService,
        StatusBar,
        SplashScreen,
        { provide: 'windowObject', useValue: window }
    ]
})
export class AppModule { }
