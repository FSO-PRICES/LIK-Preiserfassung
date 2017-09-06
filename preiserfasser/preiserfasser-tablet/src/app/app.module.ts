import { NgModule, ErrorHandler } from '@angular/core';
import { HttpModule, Http } from '@angular/http';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { StoreModule } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { ScreenOrientation } from '@ionic-native/screen-orientation';

import 'rxjs';

import { reducer } from '../reducers';
import { PreiserfasserTabletPefLanguageService } from '../services/preiserfasser-tablet-pef-language.service';

import { PEF_EFFECTS } from '../effects';

import { PefApp } from './app.component';
import { PreiserfasserCommonModule } from '../common';
import { PmsPriceEntryModule } from '../pages/pms-price-entry';

import { PefDialogService, PefMessageDialogService, PefLanguageService } from 'lik-shared';
import { PefComponentsModule } from 'lik-shared';
import { BrowserModule } from '@angular/platform-browser';

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
        TranslateModule.forRoot()
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
        PefLanguageService,
        // { provide: PefLanguageService, useValue: PreiserfasserTabletPefLanguageService },
        { provide: 'windowObject', useValue: window }
    ]
})
export class AppModule { }
