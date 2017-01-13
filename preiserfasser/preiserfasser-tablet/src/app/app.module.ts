import { NgModule, ErrorHandler } from '@angular/core';
import { HttpModule, Http } from '@angular/http';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { StoreModule } from '@ngrx/store';
import { TranslateModule, TranslateLoader, TranslateStaticLoader } from 'ng2-translate';

import 'rxjs';

import { reducer } from '../reducers';

import { PEF_EFFECTS } from '../effects';

import { MyApp } from './app.component';
import { AboutPage } from '../pages/about/about';
import { ContactPage } from '../pages/contact/contact';
import { HomePage } from '../pages/home/home';
import { TabsPage } from '../pages/tabs/tabs';
import { DashboardPage } from '../pages/dashboard/dashboard';
import { PmsDetailsPage } from '../pages/pms-details/pms-details';
import { PmsPriceEntryModule, PmsPriceEntryPage } from '../pages/pms-price-entry';
import { TestPage } from '../pages/test-page/test-page';

import { PefComponentsModule } from '../components';

export function createTranslateLoader(http: Http) {
    return new TranslateStaticLoader(http, './assets/i18n', '.json');
}

@NgModule({
    declarations: [
        MyApp,
        AboutPage,
        ContactPage,
        HomePage,
        TabsPage,
        DashboardPage,
        PmsDetailsPage,
        TestPage,
    ],
    imports: [
        IonicModule.forRoot(MyApp, {}, {
            links: [
                { component: DashboardPage, name: 'Dashboard', segment: 'home' },
                { component: PmsDetailsPage, name: 'PmsDetails', segment: 'pms-details/:pmsKey', defaultHistory: [DashboardPage] },
                { component: PmsPriceEntryPage, name: 'PriceEntry', segment: 'pms-price-entry/:pmsKey', defaultHistory: [DashboardPage] },
                { component: TestPage, name: 'Test', segment: 'test-page', defaultHistory: [DashboardPage] },
            ]
        }),
        PefComponentsModule,
        PmsPriceEntryModule,
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
        AboutPage,
        ContactPage,
        HomePage,
        TabsPage,
        DashboardPage,
        PmsPriceEntryPage,
        PmsDetailsPage,
        TestPage
    ],
    providers: [
        { provide: ErrorHandler, useClass: IonicErrorHandler }
    ]
})
export class AppModule { }
