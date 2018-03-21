import { ErrorHandler, NgModule, LOCALE_ID } from '@angular/core';
import { StoreModule } from '@ngrx/store';
import { BrowserModule } from '@angular/platform-browser';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { TranslateModule } from '@ngx-translate/core';

import { PefDialogService, PefComponentsModule } from 'lik-shared';

import { Backoffice } from './app.component';
import { PefMenuModule } from '../components/pef-menu';
import { PefDialogLoginModule, PefDialogLoginComponent } from '../components/pef-dialog-login';

import { CockpitModule } from '../pages/cockpit';
import { ExportToPrestaModule } from '../pages/export-to-presta';
import { ImportModule } from '../pages/import';
import { PreiserheberModule } from '../pages/preiserheber';
import { PreismeldestelleModule } from '../pages/preismeldestelle';
import { PreismeldungPagesModule } from '../pages/preismeldung';
import { SettingsModule } from '../pages/settings';

import { PouchService } from '../services/PouchService';

import { BO_EFFECTS } from '../effects';
import { reducer } from '../reducers';
import { PefMessageDialogService, PefLanguageService } from 'lik-shared';

@NgModule({
    declarations: [Backoffice],
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
        PreismeldungPagesModule,
        SettingsModule,
        CockpitModule,
        StoreModule.provideStore(reducer),
        TranslateModule.forRoot(),
        ...BO_EFFECTS,
    ],
    bootstrap: [IonicApp],
    entryComponents: [Backoffice, PefDialogLoginComponent],
    providers: [
        { provide: ErrorHandler, useClass: IonicErrorHandler },
        { provide: LOCALE_ID, useValue: 'de-CH' },
        PefDialogService,
        PefLanguageService,
        PefMessageDialogService,
        PouchService,
        StatusBar,
        SplashScreen,
        { provide: 'windowObject', useValue: window },
    ],
})
export class AppModule {}
