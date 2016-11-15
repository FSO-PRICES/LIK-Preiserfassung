import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { PriceEntryPage } from '../price-entry/price-entry';
@Component({
    selector: 'dashboard',
    templateUrl: 'dashboard.html'
})
export class DashboardPage {
    constructor(public navCtrl: NavController) {
    }

    pushPage() {
        this.navCtrl.push(PriceEntryPage);
    }
}
