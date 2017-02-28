import { NgModule, ErrorHandler } from '@angular/core';
import { HttpModule, Http } from '@angular/http';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { StoreModule } from '@ngrx/store';
import { TranslateModule, TranslateLoader, TranslateStaticLoader } from 'ng2-translate';
import { MaterialModule } from '@angular/material';

import 'rxjs';

import { reducer } from '../reducers';

import { PEF_EFFECTS } from '../effects';

import { MyApp } from './app.component';
import { PreiserfasserCommonModule } from '../common';
import { DashboardPage } from '../pages/dashboard/dashboard';
import { LoginModal } from '../pages/login/login';
import { PmsDetailsPage } from '../pages/pms-details/pms-details';
import { PmsPriceEntryModule, PmsPriceEntryPage } from '../pages/pms-price-entry';
import { TestPage } from '../pages/test-page/test-page';

import { PefDialogService } from 'lik-shared';
import { PefComponentsModule } from 'lik-shared';

export function createTranslateLoader(http: Http) {
    return new TranslateStaticLoader(http, './assets/i18n', '.json');
}

@NgModule({
    declarations: [
        MyApp,
        DashboardPage,
        LoginModal,
        PmsDetailsPage,
        TestPage
    ],
    imports: [
        IonicModule.forRoot(MyApp, {
            platforms: {
                android: {
                    activator: 'none',
                }
            }
        }, {
            links: [
                { component: DashboardPage, name: 'Dashboard', segment: 'home' },
                { component: PmsDetailsPage, name: 'PmsDetails', segment: 'pms-details/:pmsNummer', defaultHistory: [DashboardPage] },
                { component: PmsPriceEntryPage, name: 'PriceEntry', segment: 'pms-price-entry/:pmsNummer', defaultHistory: [DashboardPage] },
                { component: TestPage, name: 'Test', segment: 'test-page', defaultHistory: [DashboardPage] },
            ]
            }),
        MaterialModule,
        PefComponentsModule,
        PmsPriceEntryModule,
        PreiserfasserCommonModule,
        StoreModule.provideStore(reducer),
        ...PEF_EFFECTS,
        HttpModule,
        TranslateModule.forRoot({
            provide: TranslateLoader,
            useFactory: (createTranslateLoader),
            deps: [Http]
        })
    ],
    bootstrap: [IonicApp],
    entryComponents: [
        MyApp,
        DashboardPage,
        LoginModal,
        PmsPriceEntryPage,
        PmsDetailsPage,
        TestPage
    ],
    providers: [
        { provide: ErrorHandler, useClass: IonicErrorHandler },
        PefDialogService
    ]
})
export class AppModule { }
