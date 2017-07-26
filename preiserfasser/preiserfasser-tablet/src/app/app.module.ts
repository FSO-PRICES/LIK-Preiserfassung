import { NgModule, ErrorHandler } from '@angular/core';
import { HttpModule, Http } from '@angular/http';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { StoreModule } from '@ngrx/store';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { ScreenOrientation } from '@ionic-native/screen-orientation';

import 'rxjs';

import { reducer } from '../reducers';

import { PEF_EFFECTS } from '../effects';

import { PefApp } from './app.component';
import { PreiserfasserCommonModule } from '../common';
import { PmsPriceEntryModule } from '../pages/pms-price-entry';

import { PefDialogService, PefMessageDialogService } from 'lik-shared';
import { PefComponentsModule } from 'lik-shared';
import { BrowserModule } from '@angular/platform-browser';

export function createTranslateLoader(http: Http) {
    return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
    declarations: [
        PefApp,
    ],
    imports: [
        BrowserModule,
        IonicModule.forRoot(PefApp),
        PefComponentsModule,
        PmsPriceEntryModule,
        PreiserfasserCommonModule,
        StoreModule.provideStore(reducer),
        ...PEF_EFFECTS,
        HttpModule,
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: (createTranslateLoader),
                deps: [Http]
            }
        })
    ],
    bootstrap: [IonicApp],
    entryComponents: [
        PefApp
    ],
    providers: [
        { provide: ErrorHandler, useClass: IonicErrorHandler },
        PefDialogService,
        PefMessageDialogService,
        StatusBar,
        SplashScreen,
        ScreenOrientation,
        { provide: 'windowObject', useValue: window }
    ]
})
export class AppModule { }
