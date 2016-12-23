import { NgModule, ErrorHandler } from '@angular/core';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';

import 'rxjs';

import { reducer } from '../reducers';

import { PreismeldestelleEffects } from '../effects/preismeldestelle';
import { DatabaseEffects } from '../effects/database';
import { ProductEffects } from '../effects/product';
import { WindowLocationEffects } from '../effects/window-location';

import { MyApp } from './app.component';
import { AboutPage } from '../pages/about/about';
import { ContactPage } from '../pages/contact/contact';
import { HomePage } from '../pages/home/home';
import { TabsPage } from '../pages/tabs/tabs';
import { DashboardPage } from '../pages/dashboard/dashboard';
import { PmsDetailsPage } from '../pages/pms-details/pms-details';
import { PriceEntryPage, PRICE_ENTRY_COMPONENTS } from '../pages/price-entry';
import { PEF_COMPONENTS } from '../components';

@NgModule({
    declarations: [
        MyApp,
        AboutPage,
        ContactPage,
        HomePage,
        TabsPage,
        DashboardPage,
        PmsDetailsPage,
        ...PRICE_ENTRY_COMPONENTS,
        ...PEF_COMPONENTS
    ],
    imports: [
        IonicModule.forRoot(MyApp, {}, {
            links: [
                { component: DashboardPage, name: 'Dashboard', segment: 'home' },
                { component: PmsDetailsPage, name: 'PmsDetails', segment: 'pms-details/:pmsKey', defaultHistory: [DashboardPage] },
                { component: PriceEntryPage, name: 'PriceEntry', segment: 'price-entry/:pmsKey', defaultHistory: [DashboardPage] },
            ]
        }),
        StoreModule.provideStore(reducer),
        EffectsModule.run(PreismeldestelleEffects),
        EffectsModule.run(DatabaseEffects),
        EffectsModule.run(ProductEffects),
        EffectsModule.run(WindowLocationEffects)
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
        PmsDetailsPage
    ],
    providers: [
        { provide: ErrorHandler, useClass: IonicErrorHandler }
    ]
})
export class AppModule { }


