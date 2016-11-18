import { NgModule } from '@angular/core';
import { IonicApp, IonicModule } from 'ionic-angular';
import { StoreModule } from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';

import { MyApp } from './app.component';
import { AboutPage } from '../pages/about/about';
import { ContactPage } from '../pages/contact/contact';
import { HomePage } from '../pages/home/home';
import { TabsPage } from '../pages/tabs/tabs';
import { PriceEntryPage } from '../pages/price-entry/price-entry';
import { DashboardPage } from '../pages/dashboard/dashboard';
import { PEF_COMPONENTS } from '../components';

import { ProductsService } from '../services/products-service';

import { productReducer } from '../reducers/productReducer';

@NgModule({
    declarations: [
        MyApp,
        AboutPage,
        ContactPage,
        HomePage,
        TabsPage,
        PriceEntryPage,
        DashboardPage,
        ...PEF_COMPONENTS
    ],
    imports: [
        IonicModule.forRoot(MyApp, {}, {
            links: [
                { component: DashboardPage, name: 'Dashboard', segment: 'home' },
                { component: PriceEntryPage, name: 'PriceEntry', segment: 'price-entry' }
            ]
        }),
        StoreModule.provideStore({
            product: productReducer
        }),
        StoreDevtoolsModule.instrumentOnlyWithExtension()
    ],
    bootstrap: [IonicApp],
    entryComponents: [
        MyApp,
        AboutPage,
        ContactPage,
        HomePage,
        TabsPage,
        PriceEntryPage,
        DashboardPage
    ],
    providers: [
        ProductsService
    ]
})
export class AppModule { }
