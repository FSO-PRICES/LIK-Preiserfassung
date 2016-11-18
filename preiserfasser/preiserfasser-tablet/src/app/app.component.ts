import { Component } from '@angular/core';
import { Platform } from 'ionic-angular';
import { StatusBar, Splashscreen, ScreenOrientation } from 'ionic-native';

import { DashboardPage } from '../pages/dashboard/dashboard';

@Component({
    template: `
        <pef-svg-icons></pef-svg-icons>
        <ion-nav [root]="rootPage"></ion-nav>`
})
export class MyApp {
    rootPage = DashboardPage;

    constructor(platform: Platform) {
        platform.ready().then(() => {
            // Okay, so the platform is ready and our plugins are available.
            // Here you can do any higher level native things you might need.
            StatusBar.styleDefault();
            Splashscreen.hide();
            ScreenOrientation.lockOrientation('landscape');
        });
    }
}
