import { NgModule, ErrorHandler } from '@angular/core';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { StoreModule, combineReducers } from '@ngrx/store';
import 'rxjs';

import * as preismeldestelle from '../reducers/preismeldestelle';

import { reducer } from '../reducers';

import { MyApp } from './app.component';
import { AboutPage } from '../pages/about/about';
import { ContactPage } from '../pages/contact/contact';
import { HomePage } from '../pages/home/home';
import { TabsPage } from '../pages/tabs/tabs';
import { DashboardPage } from '../pages/dashboard/dashboard';
import { PEF_COMPONENTS } from '../components';

@NgModule({
    declarations: [
        MyApp,
        AboutPage,
        ContactPage,
        HomePage,
        TabsPage,
        DashboardPage,
        ...PEF_COMPONENTS
    ],
    imports: [
        IonicModule.forRoot(MyApp),
        // StoreModule.provideStore({ preismeldestelle: preismeldestelle.reducer })
        StoreModule.provideStore(reducer)
    ],
    bootstrap: [IonicApp],
    entryComponents: [
        MyApp,
        AboutPage,
        ContactPage,
        HomePage,
        TabsPage,
        DashboardPage
    ],
    providers: [{ provide: ErrorHandler, useClass: IonicErrorHandler }]
})
export class AppModule { }
