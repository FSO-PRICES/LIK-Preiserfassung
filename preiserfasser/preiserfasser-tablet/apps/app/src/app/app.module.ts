import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { File } from '@ionic-native/file/ngx';
import { ScreenOrientation } from '@ionic-native/screen-orientation/ngx';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';

import { PefComponentsModule } from '@lik-shared';

import { PEF_EFFECTS } from '../effects';
import { DashboardPageModule } from '../pages/dashboard/dashboard.module';
import { NewPriceSeriesPageModule } from '../pages/new-price-series/new-price-series.module';
import { PeDetailsPageModule } from '../pages/pe-details/pe-details.module';
import { PmsDetailsPageModule } from '../pages/pms-details/pms-details.module';
import { PmsPriceEntryPageModule } from '../pages/pms-price-entry/pms-price-entry.module';
import { PmsSortPageModule } from '../pages/pms-sort/pms-sort.module';
import { SettingsPageModule } from '../pages/settings/settings.module';
import { metaReducers, reducers } from '../reducers';
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

        StoreModule.forRoot(reducers, { metaReducers }),
    ],
    providers: [
        StatusBar,
        SplashScreen,
        File,
        { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
        ScreenOrientation,
    ],
    bootstrap: [AppComponent],
})
export class AppModule {}