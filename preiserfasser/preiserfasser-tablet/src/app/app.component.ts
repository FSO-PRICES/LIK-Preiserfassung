import { Component } from '@angular/core';
import { Platform } from 'ionic-angular';
import { StatusBar, Splashscreen, ScreenOrientation } from 'ionic-native';

import { DashboardPage } from '../pages/dashboard/dashboard';

import { initialisePouchForDev } from '../pages/dashboard/sync-data';

@Component({
    template: `
        <pef-svg-icons></pef-svg-icons>
        <ion-nav [root]="rootPage"></ion-nav>`,
    host: { '[class.pef-desktop]': 'isDesktop', '[class.pef-toolbar-right]': 'false' }
})
export class MyApp {
    rootPage = DashboardPage;
    isDesktop = false;

    constructor(platform: Platform) {
        platform.ready().then(() => {
            // StatusBar.styleDefault();
            // StatusBar.backgroundColorByHexString('#ffffff');
            // StatusBar.backgroundColorByName('black');
            StatusBar.hide();
            Splashscreen.hide();
            this.isDesktop = !platform.is('mobile');
            if (!this.isDesktop) {
                ScreenOrientation.lockOrientation('landscape');
            }
            initialisePouchForDev();
        });
    }
}
