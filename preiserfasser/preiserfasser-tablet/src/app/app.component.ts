import { Store } from '@ngrx/store';
import { Component } from '@angular/core';
import { Platform } from 'ionic-angular';
import { StatusBar, Splashscreen, ScreenOrientation } from 'ionic-native';
import { TranslateService } from 'ng2-translate';

import { AppState } from '../reducers';

import { DashboardPage } from '../pages/dashboard/dashboard';

import { initialisePouchForDev } from '../effects/pouchdb-utils';

@Component({
    template: `
        <pef-svg-icons></pef-svg-icons>
        <ion-nav [root]="rootPage"></ion-nav>`,
    host: { '[class.pef-desktop]': 'isDesktop', '[class.pef-toolbar-right]': 'false' }
})
export class MyApp {
    rootPage = DashboardPage;
    isDesktop = false;

    constructor(platform: Platform, private store: Store<AppState>, translate: TranslateService) {
        translate.setDefaultLang('de');
        translate.use('de');

        platform.ready().then(() => {
            // StatusBar.styleDefault();
            // StatusBar.backgroundColorByHexString('#ffffff');
            // StatusBar.backgroundColorByName('black');
            StatusBar.hide();
            Splashscreen.hide();
            if (platform.is('mobile')) {
                // remember when testing, this will fail on the desktop with "cannot read property 'apply' of undefined"
                ScreenOrientation.lockOrientation('landscape');
            }
            this.isDesktop = !platform.is('mobile');
            this.store.dispatch({ type: 'APP_CONFIG_SET_IS_DESKTOP', payload: this.isDesktop });
            this.store.dispatch({ type: 'PREISMELDESTELLEN_LOAD_ALL' });
            initialisePouchForDev();
        });
    }
}
