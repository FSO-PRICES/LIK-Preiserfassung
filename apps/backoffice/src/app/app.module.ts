import { CommonModule, registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de-CH';
import { LOCALE_ID, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';

import { PefComponentsModule, PefDialogService, PefLanguageService, PefMessageDialogService } from '@lik-shared';

import { PefDialogLoginModule } from '../components/pef-dialog-login';
import { PefMenuModule } from '../components/pef-menu';
import { BO_EFFECTS } from '../effects';

import { metaReducers, reducers } from '../reducers';
import { AppService } from '../services/app-service';
import { PouchService } from '../services/PouchService';
import { AppRoutingModule } from './app-routing.module';
import { Backoffice } from './app.component';

import { CockpitModule } from '../pages/cockpit';
import { ControllingModule } from '../pages/controlling';
import { ExportToPrestaModule } from '../pages/export-to-presta';
import { ImportModule } from '../pages/import';
import { PreiserheberModule } from '../pages/preiserheber';
import { PreismeldestelleModule } from '../pages/preismeldestelle';
import { PreismeldungModule, PreismeldungPagesModule } from '../pages/preismeldung';
import { ReportModule } from '../pages/reporting';
import { SettingsModule } from '../pages/settings';

registerLocaleData(localeDe);

@NgModule({
    declarations: [Backoffice],
    entryComponents: [],
    imports: [
        CommonModule,
        BrowserModule,
        EffectsModule.forRoot(BO_EFFECTS),
        IonicModule.forRoot(),
        AppRoutingModule,
        PefComponentsModule,
        PefDialogLoginModule,
        PefMenuModule,
        StoreModule.forRoot(reducers, { metaReducers }),
        TranslateModule.forRoot(),

        CockpitModule,
        ControllingModule,
        ExportToPrestaModule,
        ImportModule,
        PreiserheberModule,
        PreismeldestelleModule,
        PreismeldungModule,
        PreismeldungPagesModule,
        ReportModule,
        SettingsModule,
    ],
    providers: [
        { provide: LOCALE_ID, useValue: 'de-CH' },
        AppService,
        PefDialogService,
        PefLanguageService,
        PefMessageDialogService,
        PouchService,
        StatusBar,
        SplashScreen,
        { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
        { provide: 'windowObject', useValue: window },
    ],
    bootstrap: [Backoffice],
})
export class AppModule {}
