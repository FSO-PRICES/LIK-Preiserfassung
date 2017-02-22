import { Component, HostBinding } from '@angular/core';
import { Platform } from 'ionic-angular';
import { StatusBar, Splashscreen } from 'ionic-native';

import { PreiserheberPage } from '../pages/preiserheber/preiserheber';

@Component({
    templateUrl: 'app.html'
})
export class Backoffice {
    public rootPage = PreiserheberPage;

    constructor(platform: Platform) {
        platform.ready().then(() => {
            // Okay, so the platform is ready and our plugins are available.
            // Here you can do any higher level native things you might need.
            StatusBar.styleDefault();
            Splashscreen.hide();
        });
    }

    @HostBinding('class') classes = 'app-root pef-desktop';
}
