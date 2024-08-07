import { DialogModule } from '@angular/cdk/dialog';
import { CommonModule, registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de-CH';
import { LOCALE_ID, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { IonicModule } from '@ionic/angular';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { TranslateCompiler, TranslateModule } from '@ngx-translate/core';

import {
    NgxElectronModule,
    PefComponentsModule,
    PefDialogService,
    PefLanguageService,
    PefMessageDialogService,
    PefTranslateCompilerService,
} from '@lik-shared';

import { PefDialogLoginModule } from '../components/pef-dialog-login';
import { PefMenuModule } from '../components/pef-menu';
import { BO_EFFECTS } from '../effects';
import { CockpitModule } from '../pages/cockpit';
import { ControllingModule } from '../pages/controlling';
import { ExportToPrestaModule } from '../pages/export-to-presta';
import { ImportModule } from '../pages/import';
import { PreiserheberModule } from '../pages/preiserheber';
import { PreismeldestelleModule } from '../pages/preismeldestelle';
import { PreismeldungModule } from '../pages/preismeldung';
import { ReportModule } from '../pages/reporting';
import { SettingsModule } from '../pages/settings';
import { metaReducers, reducers } from '../reducers';
import { AppService } from '../services/app-service';
import { PouchService } from '../services/PouchService';

import { AppRoutingModule } from './app-routing.module';
import { Backoffice } from './app.component';

registerLocaleData(localeDe);

@NgModule({
    declarations: [Backoffice],
    imports: [
        CommonModule,
        BrowserModule,
        EffectsModule.forRoot(BO_EFFECTS),
        IonicModule.forRoot(),
        AppRoutingModule,
        PefComponentsModule,
        PefDialogLoginModule,
        PefMenuModule,
        StoreModule.forRoot(reducers, {
            metaReducers,
            runtimeChecks: { strictStateImmutability: true, strictActionImmutability: true },
        }),
        TranslateModule.forRoot({
            compiler: { provide: TranslateCompiler, useClass: PefTranslateCompilerService },
        }),
        DialogModule,
        NgxElectronModule,
        CockpitModule,
        ControllingModule,
        ExportToPrestaModule,
        ImportModule,
        PreiserheberModule,
        PreismeldestelleModule,
        PreismeldungModule,
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
        { provide: 'windowObject', useValue: window },
    ],
    bootstrap: [Backoffice],
})
export class AppModule {}
