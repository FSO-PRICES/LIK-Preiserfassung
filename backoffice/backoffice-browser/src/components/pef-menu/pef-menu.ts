import { environment } from '../../environments/environment';
import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { MainPages } from '../../app/app.module';

@Component({
    selector: 'header[pef-menu]',
    templateUrl: 'pef-menu.html'
})
export class PefMenuComponent {
    public pages = MainPages;
    public dangerZone = false;

    constructor(
        private navCtrl: NavController,
    ) {
        this.dangerZone = environment.couchSettings.url.indexOf('bfs-lik.lambda-it.ch') !== -1;
    }

    navigateToPage(page) {
        this.navCtrl.push(page, {}, { animate: false });
    }
}
