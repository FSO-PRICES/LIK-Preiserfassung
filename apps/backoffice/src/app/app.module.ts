import { ErrorHandler, LOCALE_ID, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';

import { PefComponentsModule, PefDialogService, PefLanguageService, PefMessageDialogService } from '@lik-shared';

import { PefDialogLoginComponent, PefDialogLoginModule } from '../components/pef-dialog-login';
import { PefMenuModule } from '../components/pef-menu';
import { BO_EFFECTS } from '../effects';
import { CockpitModule } from '../pages/cockpit';
import { ExportToPrestaModule } from '../pages/export-to-presta';
import { ImportModule } from '../pages/import';
import { PreiserheberModule } from '../pages/preiserheber';
import { PreismeldestelleModule } from '../pages/preismeldestelle';
import { PreismeldungPagesModule } from '../pages/preismeldung';
import { SettingsModule } from '../pages/settings';
import { reducer } from '../reducers';
import { AppService } from '../services/app-service';
import { PouchService } from '../services/PouchService';
import { AppRoutingModule } from './app-routing.module';
import { Backoffice } from './app.component';

@NgModule({
    declarations: [Backoffice],
    imports: [
        BrowserModule,
        ExportToPrestaModule,
        ImportModule,
        EffectsModule.forRoot(BO_EFFECTS),
        IonicModule.forRoot(),
        AppRoutingModule,
        PefComponentsModule,
        PefDialogLoginModule,
        PefMenuModule,
        PreiserheberModule,
        PreismeldestelleModule,
        PreismeldungPagesModule,
        SettingsModule,
        CockpitModule,
        StoreModule.forRoot(reducer),
        TranslateModule.forRoot(),
    ],
    bootstrap: [IonicApp],
    entryComponents: [Backoffice, PefDialogLoginComponent],
    providers: [
        { provide: ErrorHandler, useClass: IonicErrorHandler },
        { provide: LOCALE_ID, useValue: 'de-CH' },
        AppService,
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
