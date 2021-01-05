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

import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HAMMER_GESTURE_CONFIG } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { File } from '@ionic-native/file/ngx';
import { ScreenOrientation } from '@ionic-native/screen-orientation/ngx';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';

import { PefComponentsModule, PefHammerGestureConfig, PefLanguageService } from '@lik-shared';

import { PEF_EFFECTS } from '../effects';
import { DashboardPageModule } from '../pages/dashboard/dashboard.module';
import { NewPriceSeriesPageModule } from '../pages/new-price-series/new-price-series.module';
import { PeDetailsPageModule } from '../pages/pe-details/pe-details.module';
import { PmsDetailsPageModule } from '../pages/pms-details/pms-details.module';
import { PmsPriceEntryPageModule } from '../pages/pms-price-entry/pms-price-entry.module';
import { PmsSortPageModule } from '../pages/pms-sort/pms-sort.module';
import { SettingsPageModule } from '../pages/settings/settings.module';
import { metaReducers, reducers } from '../reducers';
import { PreiserfasserTabletPefLanguageService } from '../services/preiserfasser-tablet-pef-language.service';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

@NgModule({
    declarations: [AppComponent],
    entryComponents: [],
    imports: [
        BrowserModule,
        EffectsModule.forRoot(PEF_EFFECTS),
        TranslateModule.forRoot(),
        IonicModule.forRoot(),
        AppRoutingModule,
        PefComponentsModule,

        DashboardPageModule,
        NewPriceSeriesPageModule,
        PeDetailsPageModule,
        PmsDetailsPageModule,
        PmsPriceEntryPageModule,
        PmsSortPageModule,
        SettingsPageModule,

        StoreModule.forRoot(reducers, { metaReducers, runtimeChecks: { strictStateImmutability: true, strictActionImmutability: true } }),
    ],
    providers: [
        StatusBar,
        SplashScreen,
        File,
        { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
        { provide: HAMMER_GESTURE_CONFIG, useClass: PefHammerGestureConfig },
        { provide: PefLanguageService, useClass: PreiserfasserTabletPefLanguageService },
        ScreenOrientation,
    ],
    bootstrap: [AppComponent],
})
export class AppModule {}
