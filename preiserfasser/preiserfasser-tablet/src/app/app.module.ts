import { NgModule, ErrorHandler } from '@angular/core';
import { HttpModule, Http } from '@angular/http';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { StoreModule } from '@ngrx/store';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { ScreenOrientation } from '@ionic-native/screen-orientation';

import 'rxjs';

import { reducer } from '../reducers';

import { PEF_EFFECTS } from '../effects';

import { PefApp } from './app.component';
import { PreiserfasserCommonModule } from '../common';
// import { DashboardPage } from '../pages/dashboard/dashboard';
// import { LoginModal } from '../pages/login/login';
// import { NewPriceSeriesModule, NewPriceSeriesPage } from '../pages/new-price-series';
// import { PmsDetailsPage } from '../pages/pms-details/pms-details';
// import { PmsPrintComponent } from '../pages/pms-print/pms-print';
import { PmsPriceEntryModule, PmsPriceEntryPage } from '../pages/pms-price-entry';
// import { SettingsPage } from '../pages/settings/settings';
// import { TestPage } from '../pages/test-page/test-page';

import { PefDialogService } from 'lik-shared';
import { PefComponentsModule } from 'lik-shared';
import { BrowserModule } from '@angular/platform-browser';

export function createTranslateLoader(http: Http) {
    return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
    declarations: [
        // DashboardPage,
        // LoginModal,
        PefApp,
        // PmsDetailsPage,
        // PmsPrintComponent,
        // SettingsPage,
        // TestPage
    ],
    imports: [
        BrowserModule,
        IonicModule.forRoot(PefApp),
        // IonicModule.forRoot(PefApp,
        //     {
        //         platforms: {
        //             android: {
        //                 activator: 'none',
        //             }
        //         }
        //     },
        //     {
        //         links: [
        //             { component: DashboardPage, name: 'Dashboard', segment: 'home' },
        //             // { component: PmsDetailsPage, name: 'PmsDetails', segment: 'pms-details/:pmsNummer' },
        //             // { component: PmsPriceEntryPage, name: 'PriceEntry', segment: 'pms-price-entry/:pmsNummer' },
        //             // { component: NewPriceSeriesPage, name: 'NewPriceSeries', segment: 'new-price-series/:pmsNummer' },
        //             // { component: SettingsPage, name: 'Settings', segment: 'settings' },
        //             // { component: TestPage, name: 'Test', segment: 'test-page' },
        //         ]
        //     }),
        // NewPriceSeriesModule,
        PefComponentsModule,
        PmsPriceEntryModule,
        PreiserfasserCommonModule,
        StoreModule.provideStore(reducer),
        ...PEF_EFFECTS,
        HttpModule,
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: (createTranslateLoader),
                deps: [Http]
            }
        })
    ],
    bootstrap: [IonicApp],
    entryComponents: [
        // DashboardPage,
        // LoginModal,
        // NewPriceSeriesPage,
        PefApp,
        // PmsDetailsPage,
        PmsPriceEntryPage,
        // SettingsPage,
        // TestPage
    ],
    providers: [
        { provide: ErrorHandler, useClass: IonicErrorHandler },
        PefDialogService,
        StatusBar,
        SplashScreen,
        ScreenOrientation,
        { provide: 'windowObject', useValue: window }
    ]
})
export class AppModule { }
