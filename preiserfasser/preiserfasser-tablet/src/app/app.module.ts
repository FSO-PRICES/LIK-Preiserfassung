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

import { NgModule, ErrorHandler } from '@angular/core';
import { HttpModule, Http } from '@angular/http';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { StoreModule } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { ScreenOrientation } from '@ionic-native/screen-orientation';
import { File } from '@ionic-native/file';

import 'rxjs';

import { reducer } from '../reducers';
import { PreiserfasserTabletPefLanguageService } from '../services/preiserfasser-tablet-pef-language.service';

import { PEF_EFFECTS } from '../effects';

import { PefApp } from './app.component';
import { PreiserfasserCommonModule } from '../common';
import { PmsPriceEntryModule } from '../pages/pms-price-entry';

import { PefDialogService, PefMessageDialogService, PefLanguageService } from 'lik-shared';
import { PefComponentsModule } from 'lik-shared';
import { BrowserModule } from '@angular/platform-browser';

@NgModule({
    declarations: [
        PefApp,
    ],
    imports: [
        BrowserModule,
        IonicModule.forRoot(PefApp),
        PefComponentsModule,
        PmsPriceEntryModule,
        PreiserfasserCommonModule,
        StoreModule.provideStore(reducer),
        ...PEF_EFFECTS,
        HttpModule,
        TranslateModule.forRoot()
    ],
    bootstrap: [IonicApp],
    entryComponents: [
        PefApp
    ],
    providers: [
        { provide: ErrorHandler, useClass: IonicErrorHandler },
        PefDialogService,
        PefMessageDialogService,
        StatusBar,
        SplashScreen,
        ScreenOrientation,
        File,
        PefLanguageService,
        { provide: PefLanguageService, useClass: PreiserfasserTabletPefLanguageService },
        { provide: 'windowObject', useValue: window }
    ]
})
export class AppModule { }
