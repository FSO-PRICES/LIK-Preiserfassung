/*
 * LIK-Preiserfassung
 * Copyright (C) 2018 Bundesbehörden der Schweizerischen Eidgenossenschaft - Bundesamt für Statistik
 *
 * This file is part of LIK-Preiserfassung.
 *
 * LIK-Preiserfassung is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * LIK-Preiserfassung is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with LIK-Preiserfassung. If not, see <https://www.gnu.org/licenses/>.
 */

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
