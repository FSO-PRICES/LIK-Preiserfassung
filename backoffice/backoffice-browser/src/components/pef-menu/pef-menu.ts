import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { MainPages } from '../../app/app.module';

@Component({
    selector: 'ion-header[pef-menu]',
    templateUrl: 'pef-menu.html'
})
export class PefMenuComponent {
    public pages = MainPages;

    constructor(
        private navCtrl: NavController,
    ) {
    }

    navigateToPage(page) {
        this.navCtrl.setRoot(page);
    }
}
