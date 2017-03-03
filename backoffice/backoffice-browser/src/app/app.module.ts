import { ErrorHandler, NgModule } from '@angular/core';
import { StoreModule } from '@ngrx/store';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';

import { Backoffice } from './app.component';
import { PefMenuModule, PefMenuComponent } from '../components/pef-menu';
import { PreiserheberModule, PreiserheberPage } from '../pages/preiserheber';
import { PreismeldestelleModule, PreismeldestellePage } from '../pages/preismeldestelle';
import { InitializationModule, InitializationPage } from '../pages/initialization';

import { PefDialogService } from 'lik-shared';
import { PefComponentsModule } from 'lik-shared';

import { BO_EFFECTS } from '../effects';
import { reducer } from '../reducers';

export const MainPages = [
    { page: PreiserheberPage, name: 'Preiserheber' },
    { page: PreismeldestellePage, name: 'Preismeldestellen' },
    { page: InitializationPage, name: 'Initialisierung' },
];

@NgModule({
    declarations: [
        Backoffice,
    ],
    imports: [
        IonicModule.forRoot(Backoffice, {
            links: [
                { component: InitializationPage, name: 'Initialization', segment: 'init' },
                { component: PreiserheberPage, name: 'Preiserfasser', segment: 'pe' },
                { component: PreismeldestellePage, name: 'Preismeldestelle', segment: 'pms' },
            ]
        }),
        PefComponentsModule,
        PefMenuModule,
        InitializationModule,
        PreiserheberModule,
        PreismeldestelleModule,
        StoreModule.provideStore(reducer),
        ...BO_EFFECTS
    ],
    bootstrap: [IonicApp],
    entryComponents: [
        Backoffice,
        PefMenuComponent,
        InitializationPage,
        PreiserheberPage,
        PreismeldestellePage
    ],
    providers: [
        { provide: ErrorHandler, useClass: IonicErrorHandler },
        PefDialogService
    ]
})
export class AppModule { }
