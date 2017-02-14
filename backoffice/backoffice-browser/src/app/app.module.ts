import { HomePage } from '../pages/home/home';
import { InitializationPage } from '../pages/initialization/initialization';
import { PreiserfasserPage } from '../pages/preiserfasser/preiserfasser';
import { Backoffice } from './app.component';
import { ErrorHandler, NgModule } from '@angular/core';
// import { StoreModule } from '@ngrx/store';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';

@NgModule({
    declarations: [
        Backoffice,
        HomePage,
        InitializationPage,
        PreiserfasserPage
    ],
    imports: [
        IonicModule.forRoot(Backoffice, {
            links: [
                { component: InitializationPage, name: 'Initialization', segment: '' },
                { component: PreiserfasserPage, name: 'Preiserfasser', segment: 'pe/:peRef', defaultHistory: [InitializationPage] },
            ]
        }),
        // StoreModule.provideStore(reducer)
    ],
    bootstrap: [IonicApp],
    entryComponents: [
        Backoffice,
        HomePage,
        InitializationPage,
        PreiserfasserPage
    ],
    providers: [{ provide: ErrorHandler, useClass: IonicErrorHandler }]
})
export class AppModule { }
