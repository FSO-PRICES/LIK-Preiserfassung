import { NgModule, ErrorHandler } from '@angular/core';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { StoreModule } from '@ngrx/store';

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
import { PriceEntryModule, PriceEntryPage } from '../pages/price-entry';
import { TestPage } from '../pages/test-page/test-page';

import { PefComponentsModule } from '../components';

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
                { component: PriceEntryPage, name: 'PriceEntry', segment: 'price-entry/:pmsKey', defaultHistory: [DashboardPage] },
                { component: TestPage, name: 'Test', segment: 'test-page', defaultHistory: [DashboardPage] },
            ]
        }),
        PefComponentsModule,
        PriceEntryModule,
        StoreModule.provideStore(reducer),
        ...PEF_EFFECTS
    ],
    bootstrap: [IonicApp],
    entryComponents: [
        MyApp,
        AboutPage,
        ContactPage,
        HomePage,
        TabsPage,
        DashboardPage,
        PriceEntryPage,
        PmsDetailsPage,
        TestPage
    ],
    providers: [
        { provide: ErrorHandler, useClass: IonicErrorHandler }
    ]
})
export class AppModule { }


