import { ErrorHandler, NgModule } from '@angular/core';
import { StoreModule } from '@ngrx/store';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';

import { Backoffice } from './app.component';
import { HomePage } from '../pages/home/home';
import { PreiserheberModule, PreiserheberPage } from '../pages/preiserheber';
import { InitializationPage } from '../pages/initialization/initialization';

import { BO_EFFECTS } from '../effects';
import { reducer } from '../reducers';

@NgModule({
    declarations: [
        Backoffice,
        HomePage,
        InitializationPage,
    ],
    imports: [
        IonicModule.forRoot(Backoffice, {
            links: [
                { component: InitializationPage, name: 'Initialization', segment: '' },
                { component: PreiserheberPage, name: 'Preiserfasser', segment: 'pe/:peRef', defaultHistory: [InitializationPage] },
            ]
        }),
        PreiserheberModule,
        StoreModule.provideStore(reducer),
        ...BO_EFFECTS
    ],
    bootstrap: [IonicApp],
    entryComponents: [
        Backoffice,
        HomePage,
        InitializationPage,
        PreiserheberPage
    ],
    providers: [{ provide: ErrorHandler, useClass: IonicErrorHandler }]
})
export class AppModule { }
