import { Component } from '@angular/core';
import { Platform } from 'ionic-angular';
import { StatusBar, Splashscreen } from 'ionic-native';

import { PreismeldestellePage } from '../pages/preismeldestelle/preismeldestelle';


@Component({
  templateUrl: 'app.html'
})
export class Backoffice {
  rootPage = PreismeldestellePage;

  constructor(platform: Platform) {
    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      StatusBar.styleDefault();
      Splashscreen.hide();
    });
  }
}
