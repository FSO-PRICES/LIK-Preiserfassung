import { NgModule, ErrorHandler } from '@angular/core';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { StoreModule } from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { DragulaModule } from 'ng2-dragula';

import { MyApp } from './app.component';
import { AboutPage } from '../pages/about/about';
import { ContactPage } from '../pages/contact/contact';
import { HomePage } from '../pages/home/home';
import { TabsPage } from '../pages/tabs/tabs';
import { PriceEntryPage, PRICE_ENTRY_COMPONENTS } from '../pages/price-entry';
import { DragTestListItem } from '../pages/drag-test/components/drag-test-list-item';
import { DashboardPage } from '../pages/dashboard/dashboard';
import { DragTestPage } from '../pages/drag-test/drag-test';
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
        DragTestPage,
        PRICE_ENTRY_COMPONENTS,
        ...PEF_COMPONENTS,
        DragTestListItem
    ],
    imports: [
        IonicModule.forRoot(MyApp, {}, {
            links: [
                { component: DashboardPage, name: 'Dashboard', segment: 'home' },
                { component: PriceEntryPage, name: 'PriceEntry', segment: 'price-entry' },
                { component: DragTestPage, name: 'DragTest', segment: 'drag-test' }
            ]
        }),
        StoreModule.provideStore({
            product: productReducer
        }),
        StoreDevtoolsModule.instrumentOnlyWithExtension(),
        DragulaModule
    ],
    bootstrap: [IonicApp],
    entryComponents: [
        MyApp,
        AboutPage,
        ContactPage,
        HomePage,
        TabsPage,
        PriceEntryPage,
        DashboardPage,
        DragTestPage
    ],
    providers: [
        ProductsService,
        { provide: ErrorHandler, useClass: IonicErrorHandler }
    ]
})
export class AppModule { }
